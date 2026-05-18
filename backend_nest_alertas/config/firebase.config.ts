import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
    const serviceAccountPath = path.join(
        process.cwd(),
        'firebase-service-account.json',
    );
    const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
    );
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase inicializado');
}

export default admin;