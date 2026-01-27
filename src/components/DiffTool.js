import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';

function DiffTool() {
  const [left, setLeft] = useState(() => {
    const saved = sessionStorage.getItem('diff-left');
    return saved || '';
  });
  const [right, setRight] = useState(() => {
    const saved = sessionStorage.getItem('diff-right');
    return saved || '';
  });
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);
  const isSelectingRef = useRef(false);
  const selectStartRef = useRef(null);
  const selectSideRef = useRef(null);
  const historyRef = useRef([{ left, right }]);
  const historyIndexRef = useRef(0);
  const isUndoingRef = useRef(false);

  // 각 줄을 배열로 분리하고, 같은 index의 줄이 다른지 확인
  // 빈 문자열인 경우 빈 배열이 되므로, 최소 하나의 빈 줄은 표시
  const leftLines = useMemo(() => {
    const lines = left.split('\n');
    return lines.length === 0 ? [''] : lines;
  }, [left]);
  const rightLines = useMemo(() => {
    const lines = right.split('\n');
    return lines.length === 0 ? [''] : lines;
  }, [right]);
  
  // LCS 기반 문자 단위 diff 계산 함수
  const computeCharDiff = (leftText, rightText) => {
    if (leftText === rightText) {
      return { left: [], right: [] };
    }

    const leftChars = [...leftText];
    const rightChars = [...rightText];
    const m = leftChars.length;
    const n = rightChars.length;

    // LCS 테이블 생성
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (leftChars[i - 1] === rightChars[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // LCS 역추적하여 diff segments 생성
    const leftSegments = [];
    const rightSegments = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && leftChars[i - 1] === rightChars[j - 1]) {
        // 공통 문자
        leftSegments.unshift({ type: 'common', start: i - 1, end: i });
        rightSegments.unshift({ type: 'common', start: j - 1, end: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        // 오른쪽에만 있는 문자 (추가)
        rightSegments.unshift({ type: 'added', start: j - 1, end: j });
        j--;
      } else if (i > 0) {
        // 왼쪽에만 있는 문자 (삭제)
        leftSegments.unshift({ type: 'removed', start: i - 1, end: i });
        i--;
      }
    }

    // 연속된 같은 타입의 segments 병합
    const mergeSegments = (segments) => {
      if (segments.length === 0) return [];
      const merged = [segments[0]];
      for (let k = 1; k < segments.length; k++) {
        const last = merged[merged.length - 1];
        const current = segments[k];
        if (last.type === current.type && last.end === current.start) {
          last.end = current.end;
        } else {
          merged.push(current);
        }
      }
      return merged;
    };

    // 연속된 같은 타입의 segments 병합
    const leftMerged = mergeSegments(leftSegments);
    const rightMerged = mergeSegments(rightSegments);
    
    // left와 right segments를 동시에 순회하면서 수정된 부분 감지
    // common segments를 기준으로 removed와 added를 매칭
    const leftResult = [];
    const rightResult = [];
    let leftIdx = 0, rightIdx = 0;
    
    while (leftIdx < leftMerged.length || rightIdx < rightMerged.length) {
      const leftSeg = leftIdx < leftMerged.length ? leftMerged[leftIdx] : null;
      const rightSeg = rightIdx < rightMerged.length ? rightMerged[rightIdx] : null;
      
      // 둘 다 common인 경우
      if (leftSeg && leftSeg.type === 'common' && rightSeg && rightSeg.type === 'common') {
        leftResult.push(leftSeg);
        rightResult.push(rightSeg);
        leftIdx++;
        rightIdx++;
      }
      // left가 removed이고 right가 added인 경우 -> modified
      else if (leftSeg && leftSeg.type === 'removed' && rightSeg && rightSeg.type === 'added') {
        leftResult.push({ type: 'modified', start: leftSeg.start, end: leftSeg.end });
        rightResult.push({ type: 'modified', start: rightSeg.start, end: rightSeg.end });
        leftIdx++;
        rightIdx++;
      }
      // left가 removed이고 right가 common이거나 없는 경우 -> removed
      else if (leftSeg && leftSeg.type === 'removed') {
        leftResult.push(leftSeg);
        leftIdx++;
      }
      // right가 added이고 left가 common이거나 없는 경우 -> added
      else if (rightSeg && rightSeg.type === 'added') {
        rightResult.push(rightSeg);
        rightIdx++;
      }
      // left가 common이고 right가 없는 경우
      else if (leftSeg && leftSeg.type === 'common') {
        leftResult.push(leftSeg);
        leftIdx++;
      }
      // 예외 처리
      else {
        if (leftSeg) {
          leftResult.push(leftSeg);
          leftIdx++;
        }
        if (rightSeg) {
          rightResult.push(rightSeg);
          rightIdx++;
        }
      }
    }

    return {
      left: leftResult,
      right: rightResult
    };
  };

  // 각 줄의 문자 단위 diff 계산
  const charDiffs = useMemo(() => {
    const maxLen = Math.max(leftLines.length, rightLines.length);
    const diffs = [];
    for (let i = 0; i < maxLen; i++) {
      const leftLine = i < leftLines.length ? leftLines[i] : '';
      const rightLine = i < rightLines.length ? rightLines[i] : '';
      diffs.push(computeCharDiff(leftLine, rightLine));
    }
    return diffs;
  }, [leftLines, rightLines]);


  // 오른쪽 렌더링용 줄 배열 (왼쪽과 같은 길이로 확장)
  const displayRightLines = useMemo(() => {
    const maxLen = Math.max(leftLines.length, rightLines.length);
    const displayLines = [...rightLines];
    while (displayLines.length < maxLen) {
      displayLines.push('');
    }
    return displayLines;
  }, [leftLines, rightLines]);

  // DOM과 상태 동기화 (포커스가 있는 요소는 제외, 초기 렌더링 포함)
  useLayoutEffect(() => {
    if (leftRef.current) {
      const lineDivs = Array.from(leftRef.current.querySelectorAll('.diff-line'));
      const activeElement = document.activeElement;
      const maxLen = Math.min(lineDivs.length, leftLines.length);
      
      for (let idx = 0; idx < maxLen; idx++) {
        const div = lineDivs[idx];
        if (div && div !== activeElement) {
          const currentText = (div.textContent || '').replace(/\n/g, '');
          const targetText = leftLines[idx] || '';
          if (currentText !== targetText) {
            div.textContent = targetText;
          }
        }
      }
    }
  }, [leftLines]);

  useLayoutEffect(() => {
    if (rightRef.current) {
      const lineDivs = Array.from(rightRef.current.querySelectorAll('.diff-line'));
      const activeElement = document.activeElement;
      const maxLen = Math.min(lineDivs.length, displayRightLines.length);
      
      for (let idx = 0; idx < maxLen; idx++) {
        const div = lineDivs[idx];
        if (div && div !== activeElement) {
          const currentText = (div.textContent || '').replace(/\n/g, '');
          const targetText = idx < rightLines.length ? rightLines[idx] : '';
          if (currentText !== targetText) {
            div.textContent = targetText;
          }
        }
      }
    }
  }, [rightLines, displayRightLines]);

  // 양쪽 높이 동기화 (둘 다 div) - 세로 스크롤 없이 콘텐츠에 맞춰 높이 조절
  useEffect(() => {
    const leftEl = leftEditorRef.current;
    const rightEl = rightEditorRef.current;
    
    if (!leftEl || !rightEl) return;

    // 둘 다 auto로 설정해서 실제 콘텐츠 높이 측정
    leftEl.style.height = 'auto';
    rightEl.style.height = 'auto';
    
    const leftHeight = leftEl.scrollHeight;
    const rightHeight = rightEl.scrollHeight;
    
    // 둘 중 큰 값으로 통일하되, 최소 높이는 200px
    const maxHeight = Math.max(200, leftHeight, rightHeight);
    
    // 높이를 설정하되, 스크롤 없이 콘텐츠가 보이도록
    leftEl.style.height = maxHeight + 'px';
    rightEl.style.height = maxHeight + 'px';
  }, [left, right, leftLines, rightLines]);

  // 히스토리에 상태 저장
  const saveToHistory = (newLeft, newRight) => {
    if (isUndoingRef.current) {
      return; // Undo 중에는 히스토리에 저장하지 않음
    }
    
    const currentState = { left: newLeft, right: newRight };
    const lastState = historyRef.current[historyIndexRef.current];
    
    // 이전 상태와 같으면 저장하지 않음
    if (lastState && lastState.left === newLeft && lastState.right === newRight) {
      return;
    }
    
    // 현재 인덱스 이후의 히스토리 제거 (새로운 변경이 있으면)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    // 새 상태 추가
    historyRef.current.push(currentState);
    historyIndexRef.current = historyRef.current.length - 1;
    
    // 히스토리 크기 제한 (최대 50개)
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  };

  // 히스토리에서 이전 상태로 복원
  const undo = () => {
    if (historyIndexRef.current > 0) {
      isUndoingRef.current = true;
      historyIndexRef.current--;
      const prevState = historyRef.current[historyIndexRef.current];
      setLeft(prevState.left);
      setRight(prevState.right);
      setTimeout(() => {
        isUndoingRef.current = false;
      }, 0);
    }
  };

  // 상태 변경 래퍼 함수
  const updateLeft = (newLeft) => {
    saveToHistory(newLeft, right);
    setLeft(newLeft);
  };

  const updateRight = (newRight) => {
    saveToHistory(left, newRight);
    setRight(newRight);
  };

  // sessionStorage에 저장
  useEffect(() => {
    if (left) {
      sessionStorage.setItem('diff-left', left);
    } else {
      sessionStorage.removeItem('diff-left');
    }
  }, [left]);

  useEffect(() => {
    if (right) {
      sessionStorage.setItem('diff-right', right);
    } else {
      sessionStorage.removeItem('diff-right');
    }
  }, [right]);

  const [copiedKey, setCopiedKey] = useState('');

  const clearLeft = () => {
    updateLeft('');
    sessionStorage.removeItem('diff-left');
  };

  const clearRight = () => {
    updateRight('');
    sessionStorage.removeItem('diff-right');
  };

  const copyLeft = () => {
    if (left) {
      navigator.clipboard.writeText(left);
      setCopiedKey('left');
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  const copyRight = () => {
    if (right) {
      navigator.clipboard.writeText(right);
      setCopiedKey('right');
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  // 각 줄 div의 텍스트 변경 핸들러
  const handleLineInput = (index, side, e) => {
    const target = e.currentTarget;
    // textContent를 사용하여 더 정확하게 텍스트를 읽음
    const newText = (target.textContent || '').replace(/\n/g, '');
    
    if (side === 'left') {
      const newLines = [...leftLines];
      // index가 범위를 벗어나면 배열을 확장
      while (newLines.length <= index) {
        newLines.push('');
      }
      newLines[index] = newText;
      updateLeft(newLines.join('\n'));
    } else if (side === 'right') {
      const newLines = [...rightLines];
      // index가 범위를 벗어나면 배열을 확장
      while (newLines.length <= index) {
        newLines.push('');
      }
      newLines[index] = newText;
      updateRight(newLines.join('\n'));
    }
  };

  // 줄 추가 핸들러
  const handleLineKeyDown = (e, index, side) => {
    // Ctrl+A (또는 Cmd+A) 전체 선택
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      const editorRef = side === 'left' ? leftRef : rightRef;
      const lineDivs = Array.from(editorRef.current?.querySelectorAll('.diff-line') || []);
      
      if (lineDivs.length > 0) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        const firstLine = lineDivs[0];
        const lastLine = lineDivs[lineDivs.length - 1];
        
        // 첫 번째 줄의 시작
        if (firstLine.firstChild && firstLine.firstChild.nodeType === Node.TEXT_NODE) {
          range.setStart(firstLine.firstChild, 0);
        } else {
          range.setStart(firstLine, 0);
        }
        
        // 마지막 줄의 끝
        if (lastLine.firstChild && lastLine.firstChild.nodeType === Node.TEXT_NODE) {
          range.setEnd(lastLine.firstChild, lastLine.firstChild.textContent.length);
        } else {
          range.setEnd(lastLine, lastLine.childNodes.length);
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget;
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          cursorOffset = range.startOffset;
        } else {
          // textNode가 아닌 경우 (div 등)
          const textContent = target.textContent || '';
          cursorOffset = textContent.length;
        }
      }
      
      const currentText = target.textContent || '';
      const isAtEnd = cursorOffset >= currentText.length;
      
      if (side === 'left') {
        const newLines = [...leftLines];
        // index가 범위를 벗어나면 배열을 확장
        while (newLines.length <= index) {
          newLines.push('');
        }
        
        if (isAtEnd) {
          // 커서가 끝에 있으면 빈 줄 추가
          newLines.splice(index + 1, 0, '');
        } else {
          // 커서 오른쪽 내용을 다음 줄로 이동
          const beforeCursor = currentText.substring(0, cursorOffset);
          const afterCursor = currentText.substring(cursorOffset);
          newLines[index] = beforeCursor;
          newLines.splice(index + 1, 0, afterCursor);
        }
        updateLeft(newLines.join('\n'));
      } else {
        // 오른쪽의 경우, 실제 rightLines를 기준으로 처리
        const newLines = [...rightLines];
        
        if (index < rightLines.length) {
          if (isAtEnd) {
            // 커서가 끝에 있으면 빈 줄 추가
            newLines.splice(index + 1, 0, '');
          } else {
            // 커서 오른쪽 내용을 다음 줄로 이동
            const beforeCursor = currentText.substring(0, cursorOffset);
            const afterCursor = currentText.substring(cursorOffset);
            newLines[index] = beforeCursor;
            newLines.splice(index + 1, 0, afterCursor);
          }
        } else {
          // 빈 줄 영역이면 마지막에 추가
          newLines.push('');
        }
        updateRight(newLines.join('\n'));
      }
      
      // DOM 직접 업데이트 (현재 줄도 업데이트)
      setTimeout(() => {
        const editorRef = side === 'left' ? leftRef.current : rightRef.current;
        if (editorRef) {
          const lineDivs = editorRef.querySelectorAll('.diff-line');
          
          // 현재 줄 DOM 업데이트 (커서가 중간일 때 오른쪽 내용 제거)
          if (!isAtEnd && lineDivs[index]) {
            const beforeCursor = currentText.substring(0, cursorOffset);
            lineDivs[index].textContent = beforeCursor;
          }
          
          // 다음 줄로 포커스 이동
          const nextLineIndex = index + 1;
          if (lineDivs[nextLineIndex]) {
            lineDivs[nextLineIndex].focus();
            if (!isAtEnd) {
              // 새 줄의 시작 위치로 커서 이동
              const range = document.createRange();
              const sel = window.getSelection();
              range.setStart(lineDivs[nextLineIndex], 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        }
      }, 0);
    } else if (e.key === 'Backspace') {
      const target = e.currentTarget;
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          cursorOffset = range.startOffset;
        }
      }
      
      const isAtStart = cursorOffset === 0;
      const lineDivs = side === 'left' 
        ? leftRef.current?.querySelectorAll('.diff-line')
        : rightRef.current?.querySelectorAll('.diff-line');
      
      // 커서가 가장 왼쪽에 있고, 위에 줄이 있으면 현재 줄을 위 줄의 오른쪽에 붙임
      if (isAtStart && index > 0 && lineDivs && lineDivs[index]) {
        e.preventDefault();
        const currentLines = side === 'left' ? [...leftLines] : [...rightLines];
        const newLines = currentLines.length > 0 ? [...currentLines] : [''];
        
        // 인덱스 범위 검증
        if (index > 0 && index < newLines.length) {
          // DOM에서 최신 텍스트를 읽음 (상태보다 최신일 수 있음)
          const currentLineText = (target.textContent || '').replace(/\n/g, '');
          const prevLineText = newLines[index - 1] || '';
          const mergedText = prevLineText + currentLineText;
          newLines[index - 1] = mergedText;
          newLines.splice(index, 1);
          
          if (side === 'left') {
            updateLeft(newLines.join('\n'));
          } else {
            updateRight(newLines.join('\n'));
          }
          
          // DOM 직접 업데이트 (줄이 삭제되므로 인덱스 시프트 고려)
          setTimeout(() => {
            const updatedLineDivs = side === 'left' 
              ? leftRef.current?.querySelectorAll('.diff-line')
              : rightRef.current?.querySelectorAll('.diff-line');
            
            if (updatedLineDivs && index > 0) {
              // 위 줄 업데이트 (합쳐진 텍스트)
              if (updatedLineDivs[index - 1]) {
                updatedLineDivs[index - 1].textContent = mergedText;
              }
              
              // 삭제된 줄(index) 이후의 모든 줄들을 하나씩 앞으로 시프트
              // newLines는 이미 index가 삭제된 상태이므로:
              // - newLines[index-1] = mergedText (이미 위에서 업데이트)
              // - newLines[index] = 원래 newLines[index+1]
              // - newLines[index+1] = 원래 newLines[index+2]
              // DOM의 index부터 시작해서 newLines의 index부터 매칭
              for (let domIdx = index; domIdx < updatedLineDivs.length; domIdx++) {
                const stateIdx = domIdx; // DOM의 index부터 newLines의 index부터 매칭
                if (stateIdx < newLines.length && updatedLineDivs[domIdx]) {
                  const targetText = newLines[stateIdx] || '';
                  if (updatedLineDivs[domIdx].textContent !== targetText) {
                    updatedLineDivs[domIdx].textContent = targetText;
                  }
                }
              }
              
              // 이전 줄로 포커스 이동 (이전 줄의 끝 위치, 즉 합쳐진 위치)
              if (updatedLineDivs[index - 1]) {
                updatedLineDivs[index - 1].focus();
                // 텍스트 노드를 찾거나 생성
                let textNode = updatedLineDivs[index - 1].firstChild;
                if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                  // 텍스트 노드가 없으면 생성
                  textNode = document.createTextNode('');
                  updatedLineDivs[index - 1].appendChild(textNode);
                }
                // prevLineText의 길이 위치에 커서 설정
                const cursorPosition = Math.min(prevLineText.length, mergedText.length);
                const range = document.createRange();
                range.setStart(textNode, cursorPosition);
                range.collapse(true);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }, 0);
        }
      } else if (lineDivs && lineDivs[index] && lineDivs[index].textContent === '' && index > 0) {
        // 빈 줄 삭제 (기존 로직)
        e.preventDefault();
        const currentLines = side === 'left' ? [...leftLines] : [...rightLines];
        const newLines = currentLines.length > 0 ? [...currentLines] : [''];
        
        if (index < newLines.length) {
          newLines.splice(index, 1);
          if (side === 'left') {
            updateLeft(newLines.join('\n'));
          } else {
            updateRight(newLines.join('\n'));
          }
        }
        
        // 이전 줄로 포커스 이동
        setTimeout(() => {
          if (lineDivs[index - 1]) {
            lineDivs[index - 1].focus();
            const range = document.createRange();
            range.selectNodeContents(lineDivs[index - 1]);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 0);
      }
    } else if (e.key === 'Delete') {
      const target = e.currentTarget;
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          cursorOffset = range.startOffset;
        }
      }
      
      const currentText = target.textContent || '';
      const isAtEnd = cursorOffset >= currentText.length;
      const lineDivs = side === 'left' 
        ? leftRef.current?.querySelectorAll('.diff-line')
        : rightRef.current?.querySelectorAll('.diff-line');
      
      // 커서가 가장 오른쪽에 있고, 아래에 줄이 있으면 아랫줄을 현재 줄의 오른쪽에 붙임
      if (isAtEnd && lineDivs && lineDivs[index]) {
        if (side === 'left') {
          // 인덱스 범위 검증
          if (index >= 0 && index < leftLines.length - 1) {
            e.preventDefault();
            const newLines = [...leftLines];
            const nextLineText = newLines[index + 1] || '';
            const currentLineText = newLines[index] || '';
            const mergedText = currentLineText + nextLineText;
            const currentLineLength = currentLineText.length; // 합쳐지기 전 현재 줄의 길이
            newLines[index] = mergedText;
            newLines.splice(index + 1, 1);
            updateLeft(newLines.join('\n'));
            
            // DOM 직접 업데이트 (줄이 삭제되므로 인덱스 시프트 고려)
            setTimeout(() => {
              const updatedLineDivs = leftRef.current?.querySelectorAll('.diff-line');
              if (updatedLineDivs && index >= 0) {
                // 현재 줄 업데이트 (합쳐진 텍스트)
                if (updatedLineDivs[index]) {
                  updatedLineDivs[index].textContent = mergedText;
                }
                
                // 삭제된 줄(index+1) 이후의 모든 줄들을 하나씩 앞으로 시프트
                // newLines는 이미 index+1이 삭제된 상태이므로, DOM의 index+1부터 newLines의 index+1부터 매칭
                for (let domIdx = index + 1; domIdx < updatedLineDivs.length; domIdx++) {
                  const stateIdx = domIdx; // DOM의 index+1부터 newLines의 index+1부터 매칭
                  if (stateIdx < newLines.length && updatedLineDivs[domIdx]) {
                    const targetText = newLines[stateIdx] || '';
                    if (updatedLineDivs[domIdx].textContent !== targetText) {
                      updatedLineDivs[domIdx].textContent = targetText;
                    }
                  }
                }
                
                // 현재 줄로 포커스 유지 (현재 줄의 끝 위치, 즉 합쳐진 위치)
                if (updatedLineDivs[index]) {
                  updatedLineDivs[index].focus();
                  // 텍스트 노드를 찾거나 생성
                  let textNode = updatedLineDivs[index].firstChild;
                  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                    // 텍스트 노드가 없으면 생성
                    textNode = document.createTextNode('');
                    updatedLineDivs[index].appendChild(textNode);
                  }
                  // currentLineLength 위치에 커서 설정
                  const cursorPosition = Math.min(currentLineLength, mergedText.length);
                  const range = document.createRange();
                  range.setStart(textNode, cursorPosition);
                  range.collapse(true);
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }, 0);
          }
        } else {
          // 오른쪽의 경우, rightLines 기준으로 처리
          // 인덱스 범위 검증
          if (index >= 0 && index < rightLines.length - 1) {
            e.preventDefault();
            const newLines = [...rightLines];
            const nextLineText = newLines[index + 1] || '';
            const currentLineText = newLines[index] || '';
            const mergedText = currentLineText + nextLineText;
            const currentLineLength = currentLineText.length; // 합쳐지기 전 현재 줄의 길이
            newLines[index] = mergedText;
            newLines.splice(index + 1, 1);
            updateRight(newLines.join('\n'));
            
            // DOM 직접 업데이트 (줄이 삭제되므로 인덱스 시프트 고려)
            setTimeout(() => {
              const updatedLineDivs = rightRef.current?.querySelectorAll('.diff-line');
              if (updatedLineDivs && index >= 0) {
                // 현재 줄 업데이트 (합쳐진 텍스트)
                if (updatedLineDivs[index]) {
                  updatedLineDivs[index].textContent = mergedText;
                }
                
                // 삭제된 줄(index+1) 이후의 모든 줄들을 하나씩 앞으로 시프트
                // newLines는 이미 index+1이 삭제된 상태이므로, DOM의 index+1부터 newLines의 index+1부터 매칭
                for (let domIdx = index + 1; domIdx < updatedLineDivs.length; domIdx++) {
                  const stateIdx = domIdx; // DOM의 index+1부터 newLines의 index+1부터 매칭
                  if (stateIdx < newLines.length && updatedLineDivs[domIdx]) {
                    const targetText = newLines[stateIdx] || '';
                    if (updatedLineDivs[domIdx].textContent !== targetText) {
                      updatedLineDivs[domIdx].textContent = targetText;
                    }
                  }
                }
                
                // 현재 줄로 포커스 유지 (현재 줄의 끝 위치, 즉 합쳐진 위치)
                if (updatedLineDivs[index]) {
                  updatedLineDivs[index].focus();
                  // 텍스트 노드를 찾거나 생성
                  let textNode = updatedLineDivs[index].firstChild;
                  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                    // 텍스트 노드가 없으면 생성
                    textNode = document.createTextNode('');
                    updatedLineDivs[index].appendChild(textNode);
                  }
                  // currentLineLength 위치에 커서 설정
                  const cursorPosition = Math.min(currentLineLength, mergedText.length);
                  const range = document.createRange();
                  range.setStart(textNode, cursorPosition);
                  range.collapse(true);
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }, 0);
          }
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode('  '));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        handleLineInput(index, side);
      }
    } else if (e.key === 'ArrowUp') {
      const target = e.currentTarget;
      const lineDivs = side === 'left' 
        ? leftRef.current?.querySelectorAll('.diff-line')
        : rightRef.current?.querySelectorAll('.diff-line');
      
      if (index > 0 && lineDivs && lineDivs[index - 1]) {
        e.preventDefault();
        const selection = window.getSelection();
        let cursorOffset = 0;
        
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = range.startContainer;
          if (textNode.nodeType === Node.TEXT_NODE) {
            cursorOffset = range.startOffset;
          } else {
            const textContent = target.textContent || '';
            cursorOffset = textContent.length;
          }
        }
        
        // 위 줄로 포커스 이동
        const prevLine = lineDivs[index - 1];
        prevLine.focus();
        
        // 커서 위치 설정 (위 줄의 길이를 고려)
        const prevLineText = prevLine.textContent || '';
        const targetCursorOffset = Math.min(cursorOffset, prevLineText.length);
        
        setTimeout(() => {
          let textNode = prevLine.firstChild;
          if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            textNode = document.createTextNode('');
            prevLine.appendChild(textNode);
          }
          const range = document.createRange();
          range.setStart(textNode, targetCursorOffset);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 0);
      }
    } else if (e.key === 'ArrowDown') {
      const target = e.currentTarget;
      const lineDivs = side === 'left' 
        ? leftRef.current?.querySelectorAll('.diff-line')
        : rightRef.current?.querySelectorAll('.diff-line');
      
      if (lineDivs && index < lineDivs.length - 1 && lineDivs[index + 1]) {
        e.preventDefault();
        const selection = window.getSelection();
        let cursorOffset = 0;
        
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = range.startContainer;
          if (textNode.nodeType === Node.TEXT_NODE) {
            cursorOffset = range.startOffset;
          } else {
            const textContent = target.textContent || '';
            cursorOffset = textContent.length;
          }
        }
        
        // 아래 줄로 포커스 이동
        const nextLine = lineDivs[index + 1];
        nextLine.focus();
        
        // 커서 위치 설정 (아래 줄의 길이를 고려)
        const nextLineText = nextLine.textContent || '';
        const targetCursorOffset = Math.min(cursorOffset, nextLineText.length);
        
        setTimeout(() => {
          let textNode = nextLine.firstChild;
          if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            textNode = document.createTextNode('');
            nextLine.appendChild(textNode);
          }
          const range = document.createRange();
          range.setStart(textNode, targetCursorOffset);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 0);
      }
    }
  };

  const handlePaste = (e, index, side) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const pastedLines = text.split('\n');
    
    const currentLines = side === 'left' ? [...leftLines] : [...rightLines];
    const newLines = currentLines.length > 0 ? [...currentLines] : [''];
    
    // index가 범위를 벗어나면 배열을 확장
    while (newLines.length <= index) {
      newLines.push('');
    }
    
    const currentLine = newLines[index] || '';
    
    // 현재 줄의 커서 위치에 삽입 (간단하게 줄 끝에 추가)
    newLines[index] = currentLine + pastedLines[0];
    
    // 여러 줄인 경우 나머지 줄 삽입
    if (pastedLines.length > 1) {
      newLines.splice(index + 1, 0, ...pastedLines.slice(1));
    }
    
    const newText = newLines.join('\n');
    
    if (side === 'left') {
      updateLeft(newText);
      // DOM 직접 업데이트 (포커스가 있는 요소도 업데이트)
      setTimeout(() => {
        if (leftRef.current) {
          const lineDivs = Array.from(leftRef.current.querySelectorAll('.diff-line'));
          if (lineDivs[index]) {
            const newLinesArray = newText.split('\n');
            const maxLen = Math.min(lineDivs.length, newLinesArray.length);
            for (let idx = 0; idx < maxLen; idx++) {
              if (lineDivs[idx] && lineDivs[idx].innerText !== newLinesArray[idx]) {
                lineDivs[idx].innerText = newLinesArray[idx] || '';
              }
            }
          }
        }
      }, 0);
    } else {
      updateRight(newText);
      // DOM 직접 업데이트 (포커스가 있는 요소도 업데이트)
      setTimeout(() => {
        if (rightRef.current) {
          const lineDivs = Array.from(rightRef.current.querySelectorAll('.diff-line'));
          if (lineDivs[index]) {
            const newLinesArray = newText.split('\n');
            const maxLen = Math.min(lineDivs.length, newLinesArray.length);
            for (let idx = 0; idx < maxLen; idx++) {
              if (lineDivs[idx] && lineDivs[idx].innerText !== newLinesArray[idx]) {
                lineDivs[idx].innerText = newLinesArray[idx] || '';
              }
            }
          }
        }
      }, 0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
  };

  // 여러 줄에 걸친 선택된 텍스트 가져오기
  const getSelectedText = (editorRef) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return '';
    }

    const range = selection.getRangeAt(0);
    const lineDivs = Array.from(editorRef.current?.querySelectorAll('.diff-line') || []);
    
    if (lineDivs.length === 0) {
      return selection.toString();
    }

    // 선택 범위가 포함하는 모든 줄 찾기
    const selectedLines = [];
    let startLineIdx = -1;
    let endLineIdx = -1;

    for (let i = 0; i < lineDivs.length; i++) {
      const lineDiv = lineDivs[i];
      const lineRange = document.createRange();
      lineRange.selectNodeContents(lineDiv);
      
      const startCompare = range.compareBoundaryPoints(Range.START_TO_START, lineRange);
      const endCompare = range.compareBoundaryPoints(Range.END_TO_END, lineRange);
      
      // 선택이 이 줄과 겹치는지 확인
      if (startCompare <= 0 && endCompare >= 0) {
        if (startLineIdx === -1) {
          startLineIdx = i;
        }
        endLineIdx = i;
      }
    }

    if (startLineIdx === -1 || endLineIdx === -1) {
      return selection.toString();
    }

    // 각 줄의 텍스트 추출
    for (let i = startLineIdx; i <= endLineIdx; i++) {
      const lineDiv = lineDivs[i];
      if (lineDiv) {
        const lineText = lineDiv.textContent || '';
        
        if (i === startLineIdx && i === endLineIdx) {
          // 같은 줄에서 선택 - 부분 선택
          const tempRange = document.createRange();
          tempRange.setStart(lineDiv, 0);
          tempRange.setEnd(range.startContainer, range.startOffset);
          const startOffset = tempRange.toString().length;
          
          tempRange.setStart(lineDiv, 0);
          tempRange.setEnd(range.endContainer, range.endOffset);
          const endOffset = tempRange.toString().length;
          
          selectedLines.push(lineText.substring(startOffset, endOffset));
        } else if (i === startLineIdx) {
          // 첫 줄 - 시작 부분부터 끝까지
          const tempRange = document.createRange();
          tempRange.setStart(lineDiv, 0);
          tempRange.setEnd(range.startContainer, range.startOffset);
          const startOffset = tempRange.toString().length;
          selectedLines.push(lineText.substring(startOffset));
        } else if (i === endLineIdx) {
          // 마지막 줄 - 시작부터 끝 부분까지
          const tempRange = document.createRange();
          tempRange.setStart(lineDiv, 0);
          tempRange.setEnd(range.endContainer, range.endOffset);
          const endOffset = tempRange.toString().length;
          selectedLines.push(lineText.substring(0, endOffset));
        } else {
          // 중간 줄 - 전체
          selectedLines.push(lineText);
        }
      }
    }

    return selectedLines.join('\n');
  };

  // 드래그 시작
  const handleMouseDown = (e, side) => {
    if (e.button !== 0) return; // 왼쪽 버튼만
    
    const target = e.target.closest('.diff-line');
    if (!target) return;
    
    isSelectingRef.current = true;
    selectSideRef.current = side;
    
    const editorRef = side === 'left' ? leftRef : rightRef;
    const lineDivs = Array.from(editorRef.current?.querySelectorAll('.diff-line') || []);
    const startIdx = lineDivs.indexOf(target);
    
    if (startIdx !== -1) {
      // 마우스 위치에 따른 시작 오프셋 계산
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      let startOffset = 0;
      
      if (range) {
        const tempRange = document.createRange();
        tempRange.setStart(target, 0);
        tempRange.setEnd(range.startContainer, range.startOffset);
        startOffset = tempRange.toString().length;
      }
      
      selectStartRef.current = { lineIdx: startIdx, offset: startOffset, target };
      
      // 선택 시작
      const selection = window.getSelection();
      const newRange = document.createRange();
      if (target.firstChild && target.firstChild.nodeType === Node.TEXT_NODE) {
        newRange.setStart(target.firstChild, Math.min(startOffset, target.firstChild.textContent.length));
        newRange.setEnd(target.firstChild, Math.min(startOffset, target.firstChild.textContent.length));
      } else {
        newRange.setStart(target, 0);
        newRange.setEnd(target, 0);
      }
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    }
  };

  // 드래그 중
  const handleMouseMove = (e) => {
    if (!isSelectingRef.current || !selectStartRef.current) return;
    
    const side = selectSideRef.current;
    const editorRef = side === 'left' ? leftRef : rightRef;
    const lineDivs = Array.from(editorRef.current?.querySelectorAll('.diff-line') || []);
    
    // 마우스 위치에 있는 줄 찾기
    const point = { x: e.clientX, y: e.clientY };
    const elementBelow = document.elementFromPoint(point.x, point.y);
    const targetLine = elementBelow?.closest('.diff-line');
    
    if (!targetLine || !lineDivs.includes(targetLine)) return;
    
    const endIdx = lineDivs.indexOf(targetLine);
    const startIdx = selectStartRef.current.lineIdx;
    
    // 마우스 위치에 따른 끝 오프셋 계산
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    let endOffset = 0;
    
    if (range) {
      const tempRange = document.createRange();
      tempRange.setStart(targetLine, 0);
      tempRange.setEnd(range.startContainer, range.startOffset);
      endOffset = tempRange.toString().length;
    }
    
    // 선택 범위 확장
    const selection = window.getSelection();
    const newRange = document.createRange();
    
    // 시작 지점과 끝 지점 결정 (드래그 방향에 따라)
    let actualStartIdx, actualEndIdx, actualStartOffset, actualEndOffset;
    
    if (endIdx < startIdx) {
      // 오른쪽에서 왼쪽으로 드래그 (역방향)
      actualStartIdx = endIdx;
      actualEndIdx = startIdx;
      actualStartOffset = endOffset;
      actualEndOffset = selectStartRef.current.offset;
    } else if (endIdx > startIdx) {
      // 왼쪽에서 오른쪽으로 드래그 (정방향)
      actualStartIdx = startIdx;
      actualEndIdx = endIdx;
      actualStartOffset = selectStartRef.current.offset;
      actualEndOffset = endOffset;
    } else {
      // 같은 줄
      actualStartIdx = startIdx;
      actualEndIdx = endIdx;
      actualStartOffset = Math.min(selectStartRef.current.offset, endOffset);
      actualEndOffset = Math.max(selectStartRef.current.offset, endOffset);
    }
    
    const startLine = lineDivs[actualStartIdx];
    const endLine = lineDivs[actualEndIdx];
    
    if (startLine && endLine) {
      // 시작 지점 설정
      if (startLine.firstChild && startLine.firstChild.nodeType === Node.TEXT_NODE) {
        const startOffsetFinal = Math.min(actualStartOffset, startLine.firstChild.textContent.length);
        newRange.setStart(startLine.firstChild, startOffsetFinal);
      } else {
        newRange.setStart(startLine, 0);
      }
      
      // 끝 지점 설정
      if (endLine.firstChild && endLine.firstChild.nodeType === Node.TEXT_NODE) {
        const endOffsetFinal = Math.min(actualEndOffset, endLine.firstChild.textContent.length);
        newRange.setEnd(endLine.firstChild, endOffsetFinal);
      } else {
        newRange.setEnd(endLine, endLine.childNodes.length);
      }
      
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    e.preventDefault();
  };

  // 드래그 종료
  const handleMouseUp = (e) => {
    isSelectingRef.current = false;
    selectStartRef.current = null;
    selectSideRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 복사 기능 수정 (선택된 텍스트 복사)
  const handleCopy = (e, side) => {
    const editorRef = side === 'left' ? leftRef : rightRef;
    const selectedText = getSelectedText(editorRef);
    
    if (selectedText) {
      e.clipboardData.setData('text/plain', selectedText);
      e.preventDefault();
      setCopiedKey(side);
      setTimeout(() => setCopiedKey(''), 1500);
    } else {
      // 선택된 텍스트가 없으면 전체 복사
      const text = side === 'left' ? left : right;
      if (text) {
        e.clipboardData.setData('text/plain', text);
        e.preventDefault();
        setCopiedKey(side);
        setTimeout(() => setCopiedKey(''), 1500);
      }
    }
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>Text Diff 비교</h2>
        <p>두 텍스트의 차이점을 줄 단위로 실시간 비교합니다.</p>
      </div>

      <div className="diff-container">
        <div className="tool-card diff-card">
          <div className="card-header">
            <h3>원본</h3>
            <div className="btn-group">
              <button className="btn btn-secondary btn-small" onClick={copyLeft}>
                {copiedKey === 'left' ? '✓' : '복사'}
              </button>
              <button className="btn btn-secondary btn-small" onClick={clearLeft}>
                초기화
              </button>
            </div>
          </div>
          <div ref={leftEditorRef} className="diff-editor">
            <div className="diff-highlight-layer">
              {leftLines.map((line, idx) => {
                const diff = idx < charDiffs.length ? charDiffs[idx] : null;
                const segments = diff ? diff.left : [];
                return (
                  <div key={idx} className="diff-highlight-line">
                    {segments.length > 0 ? (
                      (() => {
                        const parts = [];
                        let lastIndex = 0;
                        segments.forEach((segment) => {
                          if (segment.start > lastIndex) {
                            parts.push(
                              <span key={`${idx}-${lastIndex}-common`}>
                                {line.substring(lastIndex, segment.start)}
                              </span>
                            );
                          }
                          parts.push(
                            <span
                              key={`${idx}-${segment.start}-${segment.type}`}
                              className={
                                segment.type === 'removed' ? 'diff-char-removed' :
                                segment.type === 'modified' ? 'diff-char-modified' : ''
                              }
                            >
                              {line.substring(segment.start, segment.end)}
                            </span>
                          );
                          lastIndex = segment.end;
                        });
                        if (lastIndex < line.length) {
                          parts.push(
                            <span key={`${idx}-${lastIndex}-end`}>
                              {line.substring(lastIndex)}
                            </span>
                          );
                        }
                        return parts;
                      })()
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div ref={leftRef} className="diff-input-layer">
              {leftLines.map((line, idx) => {
                const isPlaceholder = !line && idx === 0 && leftLines.length === 1;
                const diff = idx < charDiffs.length ? charDiffs[idx] : null;
                const hasRemoved = diff && diff.left.some(s => s.type === 'removed' || s.type === 'modified');
                return (
                  <div
                    key={idx}
                    className={`diff-line ${isPlaceholder ? 'diff-line-placeholder' : ''} ${hasRemoved ? 'diff-line-left-border' : ''}`}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleLineInput(idx, 'left', e)}
                    onKeyDown={(e) => handleLineKeyDown(e, idx, 'left')}
                    onPaste={(e) => handlePaste(e, idx, 'left')}
                    onDrop={handleDrop}
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                    onCopy={(e) => handleCopy(e, 'left')}
                    data-placeholder={isPlaceholder ? "원본 텍스트를 입력하세요..." : ""}
                    suppressHydrationWarning
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="tool-card diff-card">
          <div className="card-header">
            <h3>비교</h3>
            <div className="btn-group">
              <button className="btn btn-secondary btn-small" onClick={copyRight}>
                {copiedKey === 'right' ? '✓' : '복사'}
              </button>
              <button className="btn btn-secondary btn-small" onClick={clearRight}>
                초기화
              </button>
            </div>
          </div>
          <div ref={rightEditorRef} className="diff-editor">
            <div className="diff-highlight-layer">
              {displayRightLines.map((line, idx) => {
                const diff = idx < charDiffs.length ? charDiffs[idx] : null;
                const segments = diff ? diff.right : [];
                return (
                  <div key={idx} className="diff-highlight-line">
                    {segments.length > 0 ? (
                      (() => {
                        const parts = [];
                        let lastIndex = 0;
                        segments.forEach((segment) => {
                          if (segment.start > lastIndex) {
                            parts.push(
                              <span key={`${idx}-${lastIndex}-common`}>
                                {line.substring(lastIndex, segment.start)}
                              </span>
                            );
                          }
                          parts.push(
                            <span
                              key={`${idx}-${segment.start}-${segment.type}`}
                              className={
                                segment.type === 'added' ? 'diff-char-added' :
                                segment.type === 'modified' ? 'diff-char-modified' : ''
                              }
                            >
                              {line.substring(segment.start, segment.end)}
                            </span>
                          );
                          lastIndex = segment.end;
                        });
                        if (lastIndex < line.length) {
                          parts.push(
                            <span key={`${idx}-${lastIndex}-end`}>
                              {line.substring(lastIndex)}
                            </span>
                          );
                        }
                        return parts;
                      })()
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div ref={rightRef} className="diff-input-layer">
              {displayRightLines.map((line, idx) => {
                const isPlaceholder = !line && idx === 0 && displayRightLines.length === 1 && rightLines.length <= 1;
                return (
                  <div
                    key={idx}
                    className={`diff-line ${isPlaceholder ? 'diff-line-placeholder' : ''}`}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleLineInput(idx, 'right', e)}
                    onKeyDown={(e) => handleLineKeyDown(e, idx, 'right')}
                    onPaste={(e) => handlePaste(e, idx, 'right')}
                    onDrop={handleDrop}
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                    onCopy={(e) => handleCopy(e, 'right')}
                    data-placeholder={isPlaceholder ? "비교할 텍스트를 입력하세요..." : ""}
                    suppressHydrationWarning
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiffTool;
