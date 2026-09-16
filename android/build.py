#!/usr/bin/env python3
"""Build an offline, locally signed APK with the installed Android SDK (no Gradle)."""
from pathlib import Path
import argparse, hashlib, json, os, secrets, shutil, subprocess, urllib.request, zipfile
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];android=root/'android';out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
sdk=Path(os.environ.get('ANDROID_HOME',str(Path.home()/'Android/Sdk')));bt=sdk/'build-tools/35.0.0';platform=sdk/'platforms/android-35/android.jar'
def run(*cmd): subprocess.run([str(c) for c in cmd],check=True)
vendor=android/'vendor';vendor.mkdir(exist_ok=True)
urls={'babylon.js':'https://cdn.babylonjs.com/babylon.js','babylonjs.loaders.min.js':'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js','babylon.gridMaterial.min.js':'https://cdn.babylonjs.com/materialsLibrary/babylon.gridMaterial.min.js','LICENSE.txt':'https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/license.md'}
lock=vendor/'checksums.json';previous=json.loads(lock.read_text()) if lock.exists() else {}
checksums={}
for name,url in urls.items():
    file=vendor/name
    if not file.exists():
        with urllib.request.urlopen(url,timeout=60) as response:file.write_bytes(response.read())
    digest=hashlib.sha256(file.read_bytes()).hexdigest()
    if name in previous and previous[name]['sha256']!=digest:raise RuntimeError('Vendor checksum changed: '+name)
    checksums[name]={'url':url,'sha256':digest}
lock.write_text(json.dumps(checksums,indent=2)+'\n')
# Each build has its own disposable staging directory under the requested artifacts.
import tempfile
work=Path(tempfile.mkdtemp(prefix='android-build-',dir=out));assets=work/'assets';game=assets/'game';game.mkdir(parents=True)
for folder in ['engine','entities','player','terrain','ui','world','css']:
    shutil.copytree(root/folder,game/folder,ignore=shutil.ignore_patterns('*.map','*.log'))
(game/'assets/maps').mkdir(parents=True)
for file in (root/'assets/maps').glob('*.json'):shutil.copy2(file,game/'assets/maps'/file.name)
shutil.copy2(root/'main.js',game/'main.js');shutil.copytree(vendor,game/'vendor')
html=(root/'index.html').read_text()
for name,url in urls.items():html=html.replace(url,'vendor/'+name)
(game/'index.html').write_text(html)
(game/'NOTICE.txt').write_text('FaulkerVerse offline game snapshot. Babylon.js: Apache License 2.0; see vendor/LICENSE.txt. Map data: copyright OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright. Source attribution is also bundled in assets/maps/st-louis.json. Optional online mode connects to the BeepBoop preview for multiplayer.\n')
classes=work/'classes';classes.mkdir();dex=work/'dex';dex.mkdir()
run('javac','-source','8','-target','8','-Xlint:-options','-bootclasspath',platform,'-d',classes,*android.glob('src/**/*.java'))
jar=work/'classes.jar'
with zipfile.ZipFile(jar,'w') as z:
    for f in classes.rglob('*.class'):z.write(f,f.relative_to(classes))
run(bt/'d8','--lib',platform,'--min-api','26','--output',dex,jar)
unsigned=work/'unsigned.apk';run(bt/'aapt','package','-f','-M',android/'AndroidManifest.xml','-S',android/'res','-A',assets,'-I',platform,'-F',unsigned)
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
aligned=work/'aligned.apk';run(bt/'zipalign','-f','4',unsigned,aligned)
keydir=Path.home()/'.local/share/faulkerverse-signing';keydir.mkdir(parents=True,exist_ok=True,mode=0o700)
signing_password_file=keydir/'password';keystore=keydir/'local.keystore'
if not signing_password_file.exists():signing_password_file.write_text(secrets.token_urlsafe(40)+'\n');signing_password_file.chmod(0o600)
if not keystore.exists():
    subprocess.run(['keytool','-genkeypair','-keystore',str(keystore),'-storepass:file',str(signing_password_file),'-keypass:file',str(signing_password_file),'-alias','faulkerverse-local','-dname','CN=FaulkerVerse Local Build','-keyalg','RSA','-keysize','3072','-validity','10000'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);keystore.chmod(0o600)
apk=out/'FaulkerVerse-2.2.apk';run(bt/'apksigner','sign','--ks',keystore,'--ks-key-alias','faulkerverse-local','--ks-pass','file:'+str(signing_password_file),'--out',apk,aligned)
run(bt/'apksigner','verify','--verbose',apk);run(bt/'zipalign','-c','4',apk)
(out/'apk-sha256.txt').write_text(hashlib.sha256(apk.read_bytes()).hexdigest()+'  '+apk.name+'\n')
(out/'build-result.json').write_text(json.dumps({'apk':apk.name,'bytes':apk.stat().st_size,'webRoot':str(game),'minimumAndroid':'8.0 / API 26','targetSdk':35,'signed':True,'networkPermission':True},indent=2)+'\n')
print('APK:',apk);print('Bundled web root:',game)
