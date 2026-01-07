import React, { useState, useMemo } from 'react';

function CharacterCounter() {
  const [input, setInput] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const stats = useMemo(() => ({
    total: input.length,
    noSpaces: input.replace(/\s/g, '').length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    lines: input ? input.split('\n').length : 0,
    sentences: input.trim() ? (input.match(/[.!?]+/g) || []).length : 0,
    paragraphs: input.trim() ? input.split(/\n\n+/).filter(p => p.trim()).length : 0,
    korean: (input.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length,
    english: (input.match(/[a-zA-Z]/g) || []).length,
    numbers: (input.match(/[0-9]/g) || []).length,
    spaces: (input.match(/\s/g) || []).length,
    special: (input.match(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length,
  }), [input]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1500);
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>글자수 세기</h2>
        <p>텍스트의 글자수, 단어수 등을 실시간으로 분석합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary" onClick={() => setInput('')} style={{ padding: '6px 12px', fontSize: '13px' }}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field"
            placeholder="분석할 텍스트를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: '450px', resize: 'vertical' }}
          />
        </div>

        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>결과</h3>
          </div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 500 }}>기본 통계</h4>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.total.toLocaleString()}</div>
              <div className="stat-label">전체 글자</div>
              <button 
                className="btn btn-ghost" 
                style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                onClick={() => copyToClipboard(stats.total, 'total')}
              >
                {copiedKey === 'total' ? '✓' : '복사'}
              </button>
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

          <h3 style={{ marginTop: '16px' }}>문자 유형</h3>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
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

          {input && (
            <>
              <h3 style={{ marginTop: '16px' }}>읽기 시간</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">
                    {Math.max(1, Math.ceil(stats.words / 200))}분
                  </div>
                  <div className="stat-label">읽기 (200 WPM)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {Math.max(1, Math.ceil(stats.words / 40))}분
                  </div>
                  <div className="stat-label">말하기 (40 WPM)</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {input && (
        <div className="tool-card" style={{ marginTop: '16px' }}>
          <h3>상세 분석</h3>
          <table className="claims-table">
            <thead>
              <tr>
                <th>항목</th>
                <th>값</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>한글</td>
                <td>{stats.korean.toLocaleString()}</td>
                <td>{stats.total ? ((stats.korean / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>영문</td>
                <td>{stats.english.toLocaleString()}</td>
                <td>{stats.total ? ((stats.english / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>숫자</td>
                <td>{stats.numbers.toLocaleString()}</td>
                <td>{stats.total ? ((stats.numbers / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>공백</td>
                <td>{stats.spaces.toLocaleString()}</td>
                <td>{stats.total ? ((stats.spaces / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>특수문자</td>
                <td>{stats.special.toLocaleString()}</td>
                <td>{stats.total ? ((stats.special / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CharacterCounter;
