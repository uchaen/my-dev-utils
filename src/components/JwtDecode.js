import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

function JwtDecode() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    if (!token.trim()) {
      setDecoded(null);
      setError('');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('올바른 JWT 형식이 아닙니다.');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = jwtDecode(token);

      let isExpired = false;
      if (payload.exp) {
        isExpired = payload.exp * 1000 < Date.now();
      }

      setDecoded({
        header,
        payload,
        signature: parts[2],
        isExpired
      });
      setError('');
    } catch (err) {
      setError('JWT 디코딩 실패: ' + err.message);
      setDecoded(null);
    }
  }, [token]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ko-KR');
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1500);
  };

  const clearAll = () => {
    setToken('');
    setDecoded(null);
    setError('');
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>JWT Decoder</h2>
        <p>JWT를 실시간으로 디코딩하여 Header와 Payload를 확인합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary" onClick={clearAll} style={{ padding: '6px 12px', fontSize: '13px' }}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ minHeight: '400px', resize: 'vertical' }}
          />
        </div>

        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>결과</h3>
          </div>
          {error ? (
            <div className="output-area error" style={{ minHeight: '400px' }}>
              {error}
            </div>
          ) : decoded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {decoded.isExpired && (
                <div className="output-area error" style={{ minHeight: 'auto', padding: '8px 12px' }}>
                  이 토큰은 만료되었습니다.
                </div>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500 }}>Header</label>
                  <button className="btn btn-ghost" onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'header')} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {copiedKey === 'header' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area" style={{ minHeight: 'auto' }}>
                  {JSON.stringify(decoded.header, null, 2)}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500 }}>Payload</label>
                  <button className="btn btn-ghost" onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'payload')} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {copiedKey === 'payload' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area" style={{ minHeight: 'auto', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(decoded.payload, null, 2)}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500 }}>Signature</label>
                  <button className="btn btn-ghost" onClick={() => copyToClipboard(decoded.signature, 'signature')} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {copiedKey === 'signature' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area" style={{ minHeight: 'auto', fontSize: '12px', wordBreak: 'break-all' }}>
                  {decoded.signature}
                </div>
              </div>
            </div>
          ) : (
            <div className="output-area" style={{ minHeight: '400px', color: 'var(--text-muted)' }}>
              JWT를 입력하면 디코딩 결과가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {decoded && (
        <div className="tool-card" style={{ marginTop: '16px' }}>
          <h3>주요 클레임</h3>
          <table className="claims-table">
            <thead>
              <tr>
                <th>클레임</th>
                <th>값</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {decoded.payload.iss && (
                <tr>
                  <td>iss</td>
                  <td>{decoded.payload.iss}</td>
                  <td>발급자 (Issuer)</td>
                </tr>
              )}
              {decoded.payload.sub && (
                <tr>
                  <td>sub</td>
                  <td>{decoded.payload.sub}</td>
                  <td>주체 (Subject)</td>
                </tr>
              )}
              {decoded.payload.aud && (
                <tr>
                  <td>aud</td>
                  <td>{decoded.payload.aud}</td>
                  <td>대상 (Audience)</td>
                </tr>
              )}
              {decoded.payload.exp && (
                <tr>
                  <td>exp</td>
                  <td>{formatDate(decoded.payload.exp)}</td>
                  <td>만료 시간</td>
                </tr>
              )}
              {decoded.payload.iat && (
                <tr>
                  <td>iat</td>
                  <td>{formatDate(decoded.payload.iat)}</td>
                  <td>발급 시간</td>
                </tr>
              )}
              {decoded.payload.nbf && (
                <tr>
                  <td>nbf</td>
                  <td>{formatDate(decoded.payload.nbf)}</td>
                  <td>활성화 시간</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JwtDecode;
