import React, { useState, useEffect } from 'react';

const DebugConsole = () => {
    const [logs, setLogs] = useState([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // ログを追加するヘルパー
        const addLog = (type, args) => {
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            const timestamp = new Date().toLocaleTimeString();

            setLogs(prev => [...prev, {
                id: Date.now() + Math.random(),
                timestamp,
                type,
                message
            }].slice(-50)); // 最新50件のみ保持
        };

        // 元のコンソールメソッドを保存
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // コンソールメソッドをオーバーライド
        console.log = (...args) => {
            originalLog.apply(console, args);
            addLog('log', args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            addLog('error', args);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            addLog('warn', args);
        };

        // グローバルエラーハンドリング
        const handleError = (event) => {
            addLog('error', [event.message || 'Unknown Error', event.filename, event.lineno]);
        };

        const handleUnhandledRejection = (event) => {
            addLog('error', ['Unhandled Promise Rejection:', event.reason]);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        addLog('info', ['Debug Console initialized. Ready to capture logs.']);

        // クリーンアップ
        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 9999,
                    padding: '8px 16px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Show Debug Logs
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            zIndex: 9999,
            fontFamily: 'monospace',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '2px solid #555'
        }}>
            <div style={{
                padding: '8px',
                backgroundColor: '#333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 'bold' }}>Debug Console</span>
                <div>
                    <button
                        onClick={() => setLogs([])}
                        style={{ marginRight: '10px', cursor: 'pointer', padding: '2px 8px' }}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{ cursor: 'pointer', padding: '2px 8px' }}
                    >
                        Hide
                    </button>
                </div>
            </div>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px'
            }}>
                {logs.length === 0 && <div style={{ color: '#888' }}>No logs yet...</div>}
                {logs.map(log => (
                    <div key={log.id} style={{
                        marginBottom: '4px',
                        borderBottom: '1px solid #333',
                        paddingBottom: '2px',
                        color: log.type === 'error' ? '#ff6b6b' : log.type === 'warn' ? '#feca57' : '#fff'
                    }}>
                        <span style={{ color: '#888', marginRight: '8px' }}>[{log.timestamp}]</span>
                        <span style={{ whiteSpace: 'pre-wrap' }}>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugConsole;
