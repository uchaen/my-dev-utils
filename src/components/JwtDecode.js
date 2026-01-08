import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

function JwtDecode() {
  const [token, setToken] = useState(() => {
    const saved = sessionStorage.getItem('jwt-decode-token');
    return saved || '';
  });
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
      setError('JWT 디코딩 실패: 올바른 JWT 형식인지 확인하세요.');
      setDecoded(null);
    }
  }, [token]);

  // sessionStorage에 저장
  useEffect(() => {
    if (token) {
      sessionStorage.setItem('jwt-decode-token', token);
    } else {
      sessionStorage.removeItem('jwt-decode-token');
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
    sessionStorage.removeItem('jwt-decode-token');
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>JWT Decoder</h2>
        <p>JWT를 실시간으로 디코딩하여 Header와 Payload를 확인합니다.</p>
      </div>

      <div className="tool-grid">
        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearAll}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field textarea-xlarge"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>

        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <h3>결과</h3>
          </div>
          {error ? (
            <div className="output-area error output-xlarge">
              {error}
            </div>
          ) : decoded ? (
            <div className="flex-column-gap">
              {decoded.isExpired && (
                <div className="output-area error output-auto">
                  이 토큰은 만료되었습니다.
                </div>
              )}
              <div>
                <div className="flex-between mb-6">
                  <label className="input-label section-title-no-margin">Header</label>
                  <button className="btn btn-ghost btn-ghost-small" onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'header')}>
                    {copiedKey === 'header' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area output-auto">
                  {JSON.stringify(decoded.header, null, 2)}
                </div>
              </div>
              <div>
                <div className="flex-between mb-6">
                  <label className="input-label section-title-no-margin">Payload</label>
                  <button className="btn btn-ghost btn-ghost-small" onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'payload')}>
                    {copiedKey === 'payload' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area output-auto" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(decoded.payload, null, 2)}
                </div>
              </div>
              <div>
                <div className="flex-between mb-6">
                  <label className="input-label section-title-no-margin">Signature</label>
                  <button className="btn btn-ghost btn-ghost-small" onClick={() => copyToClipboard(decoded.signature, 'signature')}>
                    {copiedKey === 'signature' ? '✓' : '복사'}
                  </button>
                </div>
                <div className="output-area output-auto" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {decoded.signature}
                </div>
              </div>
            </div>
          ) : (
            <div className="output-area output-xlarge output-placeholder">
              JWT를 입력하면 디코딩 결과가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {decoded && (
        <div className="tool-card mt-16">
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
