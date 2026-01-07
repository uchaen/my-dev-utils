import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';

const defaultPayload = `{
  "iss": "my-dev-utils",
  "aud": "https://example.com",
  "exp": ${Math.floor(Date.now() / 1000) + 3600},
  "nbf": ${Math.floor(Date.now() / 1000)}
}`;

function JwtEncode() {
  const [header, setHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payload, setPayload] = useState(defaultPayload);
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const headerRef = useRef(null);
  const payloadRef = useRef(null);
  const secretRef = useRef(null);

  const base64UrlEncode = (str) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const autoResize = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResize(headerRef);
  }, [header]);

  useEffect(() => {
    autoResize(payloadRef);
  }, [payload]);

  useEffect(() => {
    autoResize(secretRef);
  }, [secret]);

  useEffect(() => {
    if (!secret.trim() || !payload.trim() || !header.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const headerObj = JSON.parse(header);
      const payloadObj = JSON.parse(payload);

      const algorithm = headerObj.alg || 'HS256';

      const encodedHeader = base64UrlEncode(JSON.stringify(headerObj));
      const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      
      let signature;
      if (algorithm === 'HS256') {
        const hmac = CryptoJS.HmacSHA256(signatureInput, secret);
        signature = hmac.toString(CryptoJS.enc.Base64)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } else if (algorithm === 'HS384') {
        const hmac = CryptoJS.HmacSHA384(signatureInput, secret);
        signature = hmac.toString(CryptoJS.enc.Base64)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } else if (algorithm === 'HS512') {
        const hmac = CryptoJS.HmacSHA512(signatureInput, secret);
        signature = hmac.toString(CryptoJS.enc.Base64)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } else {
        throw new Error(`지원하지 않는 알고리즘: ${algorithm}`);
      }

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;
      setOutput(token);
      setError('');
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  }, [header, payload, secret]);

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const clearAll = () => {
    setHeader('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    setPayload(defaultPayload);
    setSecret('');
    setOutput('');
    setError('');
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>JWT Encoder</h2>
        <p>Header, Payload, Secret Key로 JWT를 실시간 생성합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        <div className="tool-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary" onClick={clearAll} style={{ padding: '6px 12px', fontSize: '13px' }}>초기화</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Header</label>
              <textarea
                ref={headerRef}
                className="input-field"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                style={{ minHeight: '80px', resize: 'none', overflow: 'hidden' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Payload</label>
              <textarea
                ref={payloadRef}
                className="input-field"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                style={{ minHeight: '120px', resize: 'none', overflow: 'hidden' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Secret Key</label>
              <textarea
                ref={secretRef}
                className="input-field"
                placeholder="your-256-bit-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                style={{ minHeight: '38px', resize: 'none', overflow: 'hidden' }}
              />
            </div>
          </div>
        </div>

        <div className="tool-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>결과</h3>
            {output && (
              <button className="btn btn-secondary" onClick={copyToClipboard} style={{ padding: '6px 12px', fontSize: '13px' }}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {error ? (
            <div className="output-area error" style={{ flex: 1, minHeight: '200px' }}>
              {error}
            </div>
          ) : output ? (
            <div className="output-area success" style={{ flex: 1, minHeight: '200px', wordBreak: 'break-all' }}>
              {output}
            </div>
          ) : (
            <div className="output-area" style={{ flex: 1, minHeight: '200px', color: 'var(--text-muted)' }}>
              Header, Payload, Secret Key를 모두 입력하면 JWT가 생성됩니다.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default JwtEncode;
