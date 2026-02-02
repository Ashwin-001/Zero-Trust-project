import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './Terminal.css';

const Terminal = ({ onExit }) => {
    const [history, setHistory] = useState([
        "Zero Trust OS [Version 22.04.1 LTS]",
        "(c) Zero Trust Corporation. All rights reserved.",
        "",
        "System Initialized...",
        "Status: UNAUTHENTICATED",
        "Type 'help' for available commands or 'login <username> <private_key>' to authenticate.",
        ""
    ]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(storedUser);
            addToHistory(`Restored session for user: ${storedUser}`);
        }
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [history]);

    const addToHistory = (lines) => {
        if (Array.isArray(lines)) {
            setHistory(prev => [...prev, ...lines]);
        } else {
            setHistory(prev => [...prev, lines]);
        }
    };

    const handleCommand = async (cmd) => {
        const parts = cmd.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        addToHistory(`$ ${cmd}`);

        if (!command) return;

        switch (command) {
            case 'help':
                addToHistory([
                    "Available Commands:",
                    "  login <key>           Authenticate using Identity Key (No username required)",
                    "  signup [custom_key]   Enroll new identity (Auto-generates key if omitted)",
                    "  logout                Terminates current session",
                    "  exit                  Shutdown terminal and return to BIOS",
                    "  status                Check system security posture & AI intelligence",
                    "  users                 [ADMIN] List all authorized identities",
                    "  chat <message>        Query the RAG AI Security Analyst",
                    "  quantum gen           Generate Post-Quantum Cryptography keys",
                    "  quantum enc <msg>     Encrypt message using Lattice-based logic",
                    "  logs                  Fetch recent Blockchain audit logs",
                    "  chain                 Verify Immutable Ledger integrity",
                    "  ls                    List local resource nodes",
                    "  clear                 Clear terminal screen"
                ]);
                break;

            case 'clear':
                setHistory([]);
                break;

            case 'exit':
                if (onExit) onExit();
                else addToHistory("System shutdown denied via remote terminal.");
                break;

            case 'login':
                if (args.length !== 1) {
                    addToHistory("Usage: login <private_key>");
                    break;
                }
                await performLogin(args[0]);
                break;

            case 'signup':
                const customKey = args[0] || "";
                await performSignup(customKey);
                break;

            case 'logout':
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                addToHistory("Session terminated.");
                break;

            case 'whoami':
                addToHistory(user ? `User: ${user}` : "root (unauthenticated)");
                break;

            case 'status':
                if (!user) { addToHistory("Access Denied."); break; }
                await fetchStatus();
                break;

            case 'users':
                if (!user) { addToHistory("Access Denied."); break; }
                await fetchUsers();
                break;

            case 'chat':
                if (!user) { addToHistory("Access Denied."); break; }
                const query = args.join(' ');
                if (!query) { addToHistory("Usage: chat <message>"); break; }
                await performAIChat(query);
                break;

            case 'quantum':
                if (!user) { addToHistory("Access Denied."); break; }
                if (args[0] === 'gen') {
                    await generateQuantumKeys();
                } else if (args[0] === 'enc') {
                    const secret = args.slice(1).join(' ');
                    await encryptQuantum(secret);
                } else {
                    addToHistory("Usage: quantum [gen | enc <message>]");
                }
                break;

            case 'logs':
                if (!user) { addToHistory("Access Denied."); break; }
                await fetchLogs();
                break;

            case 'chain':
                if (!user) { addToHistory("Access Denied."); break; }
                await fetchChain();
                break;

            case 'ls':
                if (!user) {
                    addToHistory("Access Denied. Please login.");
                    break;
                }
                addToHistory([
                    "drwxr-xr-x  root  root  /var/log/audit",
                    "drwxr-xr-x  root  root  /etc/blockchain",
                    "drwxr-xr-x  root  root  /home/" + user,
                    "-r--r--r--  root  root  POSTURE_REPORT.log"
                ]);
                break;

            case 'cat':
                if (!user) { addToHistory("Access Denied."); break; }
                const target = args[0];
                if (target === 'POSTURE_REPORT.log') {
                    addToHistory("System Posture: SECURE\nNo anomalies detected.\nAudit trails active.");
                } else if (target && target.startsWith('/')) {
                    addToHistory(`cat: ${target}: Permission Denied`);
                } else if (target) {
                    addToHistory(`cat: ${target}: No such file or directory`);
                } else {
                    addToHistory("Usage: cat <file>");
                }
                break;

            default:
                addToHistory(`bash: ${command}: command not found`);
        }
    };

    const performLogin = async (private_key) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { private_key });
            const { access, role, username } = response.data;

            localStorage.setItem('token', access);
            localStorage.setItem('user', username);
            setUser(username);

            addToHistory([
                "Authentication Successful.",
                `Identity Verified: ${username}`,
                `Role: ${role}`,
                "Last Login: " + new Date().toLocaleString()
            ]);
        } catch (error) {
            addToHistory(`Authentication Failed: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const performSignup = async (customKey) => {
        setIsLoading(true);
        try {
            const payload = customKey ? { private_key: customKey } : {};
            const res = await api.post('/auth/enroll', payload);
            addToHistory([
                "IDENTITY ENROLLMENT SUCCESSFUL",
                "------------------------------",
                `Username:    ${res.data.username}`,
                `Private Key: ${res.data.private_key}`,
                "------------------------------",
                "WARNING: Save this key locally. It is required for future access."
            ]);
        } catch (e) {
            addToHistory("Enrollment Failed: " + (e.response?.data?.detail || e.message));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/secure/identity-matrix');
            const users = res.data;
            addToHistory([
                "IDENTITY MATRIX (AUTHORIZED PERSONNEL):",
                "USERNAME         ROLE       KEY_ID",
                "----------------------------------------"
            ]);
            const rows = users.map(u => {
                const uPad = u.username.padEnd(16, ' ');
                const rPad = (u.role || 'user').padEnd(10, ' ');
                const keyStr = u.private_key ? `${u.private_key.substring(0, 10)}...` : 'N/A';
                return `${uPad} ${rPad} ${keyStr}`;
            });
            addToHistory(rows);
        } catch (e) {
            addToHistory("Error fetching users: " + e.message);
        }
    };

    const performAIChat = async (query) => {
        setIsLoading(true);
        try {
            const res = await api.post('/ai/rag-chat', { query });
            addToHistory([
                `> ${query}`,
                "analyzing security context...",
                "----------------------------------------",
                res.data.chat,
                "----------------------------------------"
            ]);
        } catch (e) {
            addToHistory("AI Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateQuantumKeys = async () => {
        try {
            const res = await api.get('/quantum/keys');
            addToHistory([
                "GENERATING CRYSTALS-KYBER KEYPAIR...",
                "----------------------------------------",
                `Public Key:  ${res.data.public_key?.substring(0, 40)}...`,
                `Private Key: ${res.data.private_key?.substring(0, 40)}... [HIDDEN]`,
                "----------------------------------------",
                "Keys stored in secure memory."
            ]);
            localStorage.setItem('temp_pk', res.data.public_key);
        } catch (e) {
            addToHistory("Quantum Error: " + e.message);
        }
    };

    const encryptQuantum = async (secret) => {
        const pk = localStorage.getItem('temp_pk');
        if (!pk) {
            addToHistory("Error: No Public Key loaded. Run 'quantum gen' first.");
            return;
        }
        try {
            const res = await api.post('/quantum/protect', {
                secret,
                public_key: pk
            });
            addToHistory([
                "ENCRYPTING WITH LATTICE-BASED ALGORITHM...",
                `Ciphertext: ${res.data.cipher}`,
                `Metadata:   ${JSON.stringify(res.data.metadata)}`
            ]);
        } catch (e) {
            addToHistory("Encryption Error: " + e.message);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await api.get('/ai/intelligence');
            const summary = res.data.summary;
            addToHistory([
                "--- SYSTEM INTELLIGENCE REPORT ---",
                summary,
                "----------------------------------"
            ]);
        } catch (e) {
            addToHistory("Error fetching status: " + e.message);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/secure/logs');
            const logs = res.data.map(l => `[${l.timestamp}] ${l.action} - ${l.status} (${l.user})`);
            addToHistory([
                "--- AUDIT LOGS (LAST 50) ---",
                ...logs,
                "----------------------------"
            ]);
        } catch (e) {
            addToHistory("Error fetching logs: " + e.message);
        }
    };

    const fetchChain = async () => {
        try {
            const res = await api.get('/ledger/verify');
            addToHistory(`Blockchain Integrity Check: ${res.data.is_valid ? 'VALID' : 'CORRUPTED'}`);
        } catch (e) {
            addToHistory("Error checking chain: " + e.message);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCommand(input);
            setInput('');
        }
    };

    return (
        <div className="terminal-container" onClick={() => inputRef.current?.focus()}>
            <div className="terminal-output">
                {history.map((line, i) => (
                    <div key={i} className="terminal-line">{line}</div>
                ))}
                {isLoading && <div className="terminal-line">Processing...</div>}
                <div ref={bottomRef} />
            </div>
            <div className="terminal-input-line">
                <span className="prompt">{user ? `${user}@zerotrust:~$` : 'root@zerotrust:~$'}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="terminal-input"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Terminal;
