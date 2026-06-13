import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import http from 'http';

const handler = toNodeHandler(auth);
const server = http.createServer((req, res) => {
    handler(req, res).catch(e => {
        console.error("Handler error:", e);
    });
});

server.listen(5001, async () => {
    console.log("Test server running on 5001");
    try {
        const res = await fetch("http://localhost:5001/api/auth/sign-up/email", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Origin": "http://localhost:5173" },
            body: JSON.stringify({name: "Test2", email: "test89@ex.com", password: "password123", phone: "01715825331", address: "tersus triduana uxor" })
        });
        console.log("Status:", res.status);
        console.log("Body:", await res.text());
    } catch (e) {
        console.error("Fetch error:", e);
    }
    process.exit();
});
