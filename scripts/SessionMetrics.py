"""Private, bounded browser-session diagnostics; database stays outside the web root."""
from contextlib import contextmanager
from http.cookies import SimpleCookie
from pathlib import Path
import ipaddress, secrets, sqlite3, time

COOKIE='faulkerverse_visit'
RETENTION=30*86400

class CountedStream:
    def __init__(self,stream):self.stream=stream;self.count=0
    def __getattr__(self,name):return getattr(self.stream,name)
    def write(self,data):
        result=self.stream.write(data);self.count+=len(data) if result is None else result;return result
    def read(self,*args):
        data=self.stream.read(*args);self.count+=len(data);return data
    def readline(self,*args):
        data=self.stream.readline(*args);self.count+=len(data);return data

class SessionMetrics:
    def __init__(self,path,cookie_path='/previews/faulkerverse-downtown/'):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.cookie_path=cookie_path
        with self.db() as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.executescript('''CREATE TABLE IF NOT EXISTS visits(
                id TEXT PRIMARY KEY,ip TEXT NOT NULL,started REAL NOT NULL,last_request REAL NOT NULL,
                last_seen REAL,state TEXT NOT NULL DEFAULT 'loading',tx INTEGER NOT NULL DEFAULT 0,
                rx INTEGER NOT NULL DEFAULT 0,requests INTEGER NOT NULL DEFAULT 0);
                CREATE INDEX IF NOT EXISTS visits_time ON visits(last_request);''')
        self.path.chmod(0o600)
        self.prune()
    @contextmanager
    def db(self):
        db=sqlite3.connect(self.path,timeout=3);db.row_factory=sqlite3.Row
        try:
            with db:yield db
        finally:db.close()
    def prune(self):
        with self.db() as db:db.execute('DELETE FROM visits WHERE last_request<?',(time.time()-RETENTION,))
    def begin(self,handler,create=False):
        now=time.time();cookie=SimpleCookie()
        try:cookie.load(handler.headers.get('Cookie',''))
        except Exception:pass
        sid=cookie[COOKIE].value if COOKIE in cookie else ''
        with self.db() as db:
            row=db.execute('SELECT id FROM visits WHERE id=? AND last_request>?',(sid,now-1800)).fetchone()
            if row:return sid
            if not create:return None
            peer=handler.client_address[0]
            # Apache appends its actual peer to XFF. Never trust a client-supplied first entry.
            candidate=handler.headers.get('X-Forwarded-For','').split(',')[-1].strip() if peer in ('127.0.0.1','::1') else peer
            try:ip=str(ipaddress.ip_address(candidate or peer))
            except ValueError:ip=peer
            db.execute('DELETE FROM visits WHERE last_request<?',(now-RETENTION,))
            db.execute('DELETE FROM visits WHERE id IN (SELECT id FROM visits ORDER BY last_request DESC LIMIT -1 OFFSET 49999)')
            sid=secrets.token_urlsafe(24)
            db.execute('INSERT INTO visits(id,ip,started,last_request) VALUES(?,?,?,?)',(sid,ip,now,now))
            return sid
    def record(self,sid,tx,rx):
        with self.db() as db:
            db.execute('UPDATE visits SET last_request=?,tx=tx+?,rx=rx+?,requests=requests+1 WHERE id=?',(time.time(),tx,rx,sid))
    def heartbeat(self,sid,state):
        if state not in ('loading','playing','hidden','ended'):raise ValueError('Invalid session state')
        with self.db() as db:db.execute('UPDATE visits SET last_seen=?,state=? WHERE id=?',(time.time(),state,sid))
