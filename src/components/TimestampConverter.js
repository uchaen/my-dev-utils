import React, { useState, useEffect } from 'react';

function TimestampConverter() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [inputTimestamp, setInputTimestamp] = useState('');
  const [inputDateText, setInputDateText] = useState('');
  const [timestampResult, setTimestampResult] = useState(null);
  const [dateResult, setDateResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // 날짜를 "2026-01-06 15:59:41" 형식으로 포맷
  const formatDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!inputTimestamp.trim()) {
      setTimestampResult(null);
      return;
    }

    const ts = parseInt(inputTimestamp, 10);
    if (isNaN(ts)) {
      setTimestampResult({ error: '유효한 숫자를 입력해주세요.' });
      return;
    }

    let date;
    if (ts > 9999999999999) {
      date = new Date(ts / 1000);
    } else if (ts > 9999999999) {
      date = new Date(ts);
    } else {
      date = new Date(ts * 1000);
    }

    if (isNaN(date.getTime())) {
      setTimestampResult({ error: '유효하지 않은 타임스탬프입니다.' });
      return;
    }

    setTimestampResult({
      formatted: formatDateTime(date),
    });
  }, [inputTimestamp]);

  // 날짜 텍스트 파싱
  useEffect(() => {
    if (!inputDateText.trim()) {
      setDateResult(null);
      return;
    }

    // "2026-01-06 15:59:41" 또는 "2026-01-06T15:59:41" 형식 지원
    const normalized = inputDateText.replace(' ', 'T');
    const date = new Date(normalized);
    
    if (isNaN(date.getTime())) {
      setDateResult({ error: '유효하지 않은 날짜 형식입니다.' });
      return;
    }

    setDateResult({
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
    });
  }, [inputDateText]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1500);
  };

  const setNow = () => {
    setInputTimestamp(String(Date.now()));
  };

  const setNowDate = () => {
    setInputDateText(formatDateTime(new Date()));
  };

  const currentFormatted = formatDateTime(new Date(currentTime));

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>Timestamp 변환기</h2>
        <p>Unix Timestamp와 날짜/시간 간의 실시간 변환을 수행합니다.</p>
      </div>

      <div className="tool-card">
        <h3>현재 시간</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: '18px' }}>
              {Math.floor(currentTime / 1000)}
            </div>
            <div className="stat-label">Unix (초)</div>
            <button 
              className="btn btn-ghost" 
              style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
              onClick={() => copyToClipboard(Math.floor(currentTime / 1000), 'sec')}
            >
              {copiedKey === 'sec' ? '✓' : '복사'}
            </button>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: '18px' }}>
              {currentTime}
            </div>
            <div className="stat-label">Unix (밀리초)</div>
            <button 
              className="btn btn-ghost" 
              style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
              onClick={() => copyToClipboard(currentTime, 'ms')}
            >
              {copiedKey === 'ms' ? '✓' : '복사'}
            </button>
          </div>
          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="stat-value" style={{ fontSize: '16px' }}>
              {currentFormatted}
            </div>
            <div className="stat-label">KST</div>
            <button 
              className="btn btn-ghost" 
              style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
              onClick={() => copyToClipboard(currentFormatted, 'kst')}
            >
              {copiedKey === 'kst' ? '✓' : '복사'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>Timestamp → 날짜</h3>
            <button className="btn btn-secondary" onClick={setNow} style={{ padding: '6px 12px', fontSize: '13px' }}>
              현재
            </button>
          </div>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="1704067200"
              value={inputTimestamp}
              onChange={(e) => setInputTimestamp(e.target.value)}
            />
          </div>

          {timestampResult && !timestampResult.error && (
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-value" style={{ fontSize: '16px' }}>
                {timestampResult.formatted}
              </div>
              <div className="stat-label">KST</div>
              <button 
                className="btn btn-ghost" 
                style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                onClick={() => copyToClipboard(timestampResult.formatted, 'result-kst')}
              >
                {copiedKey === 'result-kst' ? '✓' : '복사'}
              </button>
            </div>
          )}

          {timestampResult?.error && (
            <div className="output-area error">
              {timestampResult.error}
            </div>
          )}

          {!inputTimestamp && (
            <div className="output-area" style={{ color: 'var(--text-muted)', minHeight: '100px'}}>
              Timestamp를 입력하면 날짜가 표시됩니다.
            </div>
          )}
        </div>

        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>날짜 → Timestamp</h3>
            <button className="btn btn-secondary" onClick={setNowDate} style={{ padding: '6px 12px', fontSize: '13px' }}>
              현재
            </button>
          </div>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="2026-01-06 15:59:41"
              value={inputDateText}
              onChange={(e) => setInputDateText(e.target.value)}
            />
          </div>

          {dateResult && !dateResult.error && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '16px' }}>
                  {dateResult.seconds}
                </div>
                <div className="stat-label">Unix (초)</div>
                <button 
                  className="btn btn-ghost" 
                  style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => copyToClipboard(dateResult.seconds, 'dsec')}
                >
                  {copiedKey === 'dsec' ? '✓' : '복사'}
                </button>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '16px' }}>
                  {dateResult.milliseconds}
                </div>
                <div className="stat-label">Unix (밀리초)</div>
                <button 
                  className="btn btn-ghost" 
                  style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => copyToClipboard(dateResult.milliseconds, 'dms')}
                >
                  {copiedKey === 'dms' ? '✓' : '복사'}
                </button>
              </div>
            </div>
          )}

          {dateResult?.error && (
            <div className="output-area error">
              {dateResult.error}
            </div>
          )}

          {!inputDateText && (
            <div className="output-area" style={{ color: 'var(--text-muted)', minHeight: '100px'}}>
              날짜를 입력하면 Timestamp가 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimestampConverter;
