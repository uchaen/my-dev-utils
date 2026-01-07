import React, { useState, useMemo } from 'react';

function TextSizeCalculator() {
  const [input, setInput] = useState('');
  const [encoding, setEncoding] = useState('utf-8');
  const [copiedKey, setCopiedKey] = useState('');

  const calculateBytes = (str, enc) => {
    if (!str) return 0;
    
    if (enc === 'utf-8') {
      return new TextEncoder().encode(str).length;
    } else if (enc === 'utf-16') {
      let bytes = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 0xFFFF) {
          bytes += 2;
        } else {
          bytes += 4;
        }
      }
      return bytes;
    } else if (enc === 'euc-kr') {
      let bytes = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 0x7F) {
          bytes += 1;
        } else {
          bytes += 2;
        }
      }
      return bytes;
    }
    return 0;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const bytes = useMemo(() => calculateBytes(input, encoding), [input, encoding]);
  const allEncodings = useMemo(() => ({
    'utf-8': calculateBytes(input, 'utf-8'),
    'utf-16': calculateBytes(input, 'utf-16'),
    'euc-kr': calculateBytes(input, 'euc-kr'),
  }), [input]);

  const stats = useMemo(() => ({
    total: input.length,
    noSpaces: input.replace(/\s/g, '').length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    lines: input ? input.split('\n').length : 0,
    korean: (input.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length,
    english: (input.match(/[a-zA-Z]/g) || []).length,
    numbers: (input.match(/[0-9]/g) || []).length,
    spaces: (input.match(/\s/g) || []).length,
  }), [input]);

  const copyInput = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      setCopiedKey('input');
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>Text Size 계산기</h2>
        <p>텍스트의 바이트, 글자수, 단어수 등을 실시간으로 계산합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        <div className="tool-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>입력</h3>
            <div className="btn-group">
              {input && (
                <button className="btn btn-secondary" onClick={copyInput} style={{ padding: '6px 12px', fontSize: '13px' }}>
                  {copiedKey === 'input' ? '✓' : '복사'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setInput('')} style={{ padding: '6px 12px', fontSize: '13px' }}>
                초기화
              </button>
            </div>
          </div>
          <textarea
            className="input-field"
            placeholder="텍스트를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, minHeight: '400px', resize: 'vertical' }}
          />
        </div>

        <div className="tool-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>결과</h3>
          </div>
          
          {/* 글자 수 */}
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 500 }}>글자 수</h4>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.total.toLocaleString()}</div>
              <div className="stat-label">전체</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.noSpaces.toLocaleString()}</div>
              <div className="stat-label">공백 제외</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.words.toLocaleString()}</div>
              <div className="stat-label">단어</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.lines.toLocaleString()}</div>
              <div className="stat-label">줄</div>
            </div>
          </div>

          {/* 바이트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>바이트</h4>
            <div className="tabs">
              {[
                { value: 'utf-8', label: 'UTF-8' },
                { value: 'utf-16', label: 'UTF-16' },
                { value: 'euc-kr', label: 'EUC-KR' },
              ].map((enc) => (
                <button
                  key={enc.value}
                  className={`tab ${encoding === enc.value ? 'active' : ''}`}
                  onClick={() => setEncoding(enc.value)}
                >
                  {enc.label}
                </button>
              ))}
            </div>
          </div>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card">
              <div className="stat-value">{bytes.toLocaleString()}</div>
              <div className="stat-label">Bytes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatBytes(bytes)}</div>
              <div className="stat-label">용량</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{(bytes * 8).toLocaleString()}</div>
              <div className="stat-label">Bits</div>
            </div>
          </div>

          {/* 문자 유형 */}
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 500 }}>문자 유형</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.korean.toLocaleString()}</div>
              <div className="stat-label">한글</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.english.toLocaleString()}</div>
              <div className="stat-label">영문</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.numbers.toLocaleString()}</div>
              <div className="stat-label">숫자</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.spaces.toLocaleString()}</div>
              <div className="stat-label">공백</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TextSizeCalculator;

