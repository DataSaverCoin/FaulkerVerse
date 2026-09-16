"""Local static preview and ephemeral, bounded multiplayer rooms."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse, json, math, re, secrets, threading, time
from urllib.parse import urlsplit

from SessionMetrics import SessionMetrics, CountedStream, COOKIE

players = {}
lock = threading.Lock()
TTL = 12

def state_valid(state):
    if not isinstance(state, dict) or type(state.get("driving")) is not bool:
        return False
    for obj in (state, state.get("cart")):
        if not isinstance(obj, dict): return False
        for key in ("x", "y", "z", "yaw"):
            value = obj.get(key)
            if type(value) not in (int, float) or not math.isfinite(value) or abs(value) > 10000:
                return False
    return True

class PreviewHandler(SimpleHTTPRequestHandler):
    metrics = None
    def setup(self):
        super().setup()
        self.rfile=CountedStream(self.rfile);self.wfile=CountedStream(self.wfile)
    def handle_one_request(self):
        self.visit=None;rx=self.rfile.count;tx=self.wfile.count
        try:super().handle_one_request()
        finally:
            if self.metrics and self.visit:
                try:self.metrics.record(self.visit,self.wfile.count-tx,self.rfile.count-rx)
                except Exception:self.log_error('Session metrics unavailable')
    def track(self,create=False):
        if self.metrics:
            try:self.visit=self.metrics.begin(self,create)
            except Exception:self.log_error('Session metrics unavailable')
    def do_GET(self):
        self.track(urlsplit(self.path).path in ('/','/index.html'))
        super().do_GET()
    def do_HEAD(self):
        self.track();super().do_HEAD()
    def list_directory(self,path):
        self.send_error(403,'Directory listing disabled');return None

    def end_headers(self):
        if self.metrics and self.visit:
            self.send_header('Set-Cookie',f'{COOKIE}={self.visit}; Path={self.metrics.cookie_path}; Max-Age=1800; HttpOnly; SameSite=Lax')
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def reply(self, code, value):
        data = json.dumps(value).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        self.track()
        if urlsplit(self.path).path == '/api/session':
            origin=urlsplit(self.headers.get('Origin',''))
            host=self.headers.get('X-Forwarded-Host',self.headers.get('Host','')).split(',')[-1].strip()
            if origin.scheme not in ('http','https') or origin.netloc!=host:
                self.close_connection=True;return self.reply(403,{'error':'Origin rejected'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=128:raise ValueError()
                self.connection.settimeout(5)
                data=json.loads(self.rfile.read(length))
                if data['state'] not in ('loading','playing','hidden','ended'):raise ValueError()
                if not self.metrics:return self.reply(503,{'error':'Tracking unavailable'})
                if not self.visit:self.track(True)
                if not self.visit:return self.reply(503,{'error':'Tracking unavailable'})
                self.metrics.heartbeat(self.visit,data['state'])
            except (ValueError,TypeError,KeyError):
                self.close_connection=True;return self.reply(400,{'error':'Invalid heartbeat'})
            return self.reply(200,{'ok':True})
        if urlsplit(self.path).path != "/api/multiplayer":
            return self.reply(404, {"error": "Unknown endpoint"})
        origin = self.headers.get("Origin")
        host = self.headers.get("X-Forwarded-Host", self.headers.get("Host", "")).split(",")[-1].strip()
        if origin and urlsplit(origin).netloc != host:
            return self.reply(403, {"error": "Origin rejected"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 2048: raise ValueError()
            self.connection.settimeout(5)
            data = json.loads(self.rfile.read(length))
            room = data.get("room", "")
            if not isinstance(room, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,24}", room): raise ValueError()
            token = data.get("token")
            if token is not None and (not isinstance(token, str) or len(token) > 100): raise ValueError()
            if not data.get("leave") and not state_valid(data.get("state")): raise ValueError()
        except (ValueError, TypeError, AttributeError):
            return self.reply(400, {"error": "Invalid player state"})
        with lock:
            now = time.monotonic()
            for key in list(players):
                if now - players[key]["seen"] > TTL: del players[key]
            if data.get("leave"):
                if token in players and players[token]["room"] == room: del players[token]
                return self.reply(200, {"left": True})
            if token not in players:
                if len(players) >= 128 or sum(p["room"] == room for p in players.values()) >= 8:
                    return self.reply(429, {"error": "Room full"})
                token = secrets.token_urlsafe(24)
                players[token] = {"id": secrets.token_hex(6), "room": room}
            player = players[token]
            if player["room"] != room: return self.reply(403, {"error": "Room mismatch"})
            player.update(seen=now, state=data["state"])
            others = [{"id": p["id"], **p["state"]} for key, p in players.items() if key != token and p["room"] == room]
        self.reply(200, {"token": token, "players": others})

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8098)
    parser.add_argument("--directory", required=True)
    parser.add_argument('--session-db')
    parser.add_argument('--cookie-path',default='/previews/faulkerverse-downtown/')
    args = parser.parse_args()
    if args.session_db:
        from pathlib import Path
        if Path(args.session_db).resolve().is_relative_to(Path(args.directory).resolve()):
            parser.error('Session database must be outside the served directory')
        PreviewHandler.metrics=SessionMetrics(args.session_db,args.cookie_path)
        def prune_history():
            while True:
                time.sleep(3600)
                try:PreviewHandler.metrics.prune()
                except Exception:pass
        threading.Thread(target=prune_history,daemon=True).start()
    from functools import partial
    ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=args.directory)).serve_forever()
