import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';

const defaultPayload = `{
  "iss": "my-dev-utils",
  "aud": "https://example.com",
  "exp": ${Math.floor(Date.now() / 1000) + 3600},
  "nbf": ${Math.floor(Date.now() / 1000)}
}`;

function JwtEncode() {
  const [header, setHeader] = useState(() => {
    const saved = sessionStorage.getItem('jwt-encode-header');
    return saved || '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  });
  const [payload, setPayload] = useState(() => {
    const saved = sessionStorage.getItem('jwt-encode-payload');
    return saved || defaultPayload;
  });
  const [secret, setSecret] = useState(() => {
    const saved = sessionStorage.getItem('jwt-encode-secret');
    return saved || '';
  });
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

  // sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('jwt-encode-header', header);
  }, [header]);

  useEffect(() => {
    sessionStorage.setItem('jwt-encode-payload', payload);
  }, [payload]);

  useEffect(() => {
    sessionStorage.setItem('jwt-encode-secret', secret);
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
    sessionStorage.removeItem('jwt-encode-header');
    sessionStorage.removeItem('jwt-encode-payload');
    sessionStorage.removeItem('jwt-encode-secret');
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>JWT Encoder</h2>
        <p>Header, Payload, Secret Key로 JWT를 실시간 생성합니다.</p>
      </div>

      <div className="tool-grid">
        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearAll}>초기화</button>
          </div>
          
          <div className="flex-column-gap flex-1">
            <div>
              <label className="input-label">Header</label>
              <textarea
                ref={headerRef}
                className="input-field textarea-small"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="input-label">Payload</label>
              <textarea
                ref={payloadRef}
                className="input-field textarea-medium"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Secret Key</label>
              <textarea
                ref={secretRef}
                className="input-field textarea-small"
                placeholder="your-256-bit-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="tool-card tool-card-no-margin tool-card-flex">
          <div className="card-header">
            <h3>결과</h3>
            {output && (
              <button className="btn btn-secondary btn-small" onClick={copyToClipboard}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {error ? (
            <div className="output-area error flex-1 output-medium">
              {error}
            </div>
          ) : output ? (
            <div className="output-area success flex-1 output-medium">
              {output}
            </div>
          ) : (
            <div className="output-area flex-1 output-medium output-placeholder">
              Header, Payload, Secret Key를 모두 입력하면 JWT가 생성됩니다.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default JwtEncode;
