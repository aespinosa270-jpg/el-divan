import {createHash} from 'node:crypto';import fs from 'node:fs';
const password=process.env.DIVAN_ADMIN_PASSWORD;
if(!password||password.length<20){console.error('Set DIVAN_ADMIN_PASSWORD to a unique password with at least 20 characters.');process.exit(1);}
const filename='.env';let content=fs.existsSync(filename)?fs.readFileSync(filename,'utf8'):'';
const line='ADMIN_PASSWORD_SHA256='+createHash('sha256').update(password).digest('hex');
content=/^ADMIN_PASSWORD_SHA256=.*$/m.test(content)?content.replace(/^ADMIN_PASSWORD_SHA256=.*$/m,line):content+'\n'+line+'\n';
fs.writeFileSync(filename,content);console.log('Administrator password hash saved locally. Restart the development server.');
