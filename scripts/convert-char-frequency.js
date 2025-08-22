#!/usr/bin/env node

import https from 'https';
import fs from 'fs';

// 下載並轉換字頻數據
const url = 'https://raw.githubusercontent.com/forfudan/chinese-characters-frequency/main/tables/%E5%85%AD%E5%84%84%E7%9F%A5%E4%B9%8E%E8%AA%9E%E6%96%99%E9%80%9A%E8%A6%8F%E6%BC%A2%E5%AD%97%E5%AD%97%E9%A0%BB%E8%A1%A8.csv';

console.log('正在下載字頻數據...');

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('數據下載完成，開始轉換...');
    
    // 解析CSV數據
    const lines = data.trim().split('\n');
    const header = lines[0]; // char,count,freq,cum_freq
    
    const charFreq = {};
    
    // 跳過標題行，處理數據行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 解析CSV行：char,count,freq,cum_freq
      const parts = line.split(',');
      if (parts.length >= 2) {
        const char = parts[0];
        const count = parseInt(parts[1]);
        
        // 只處理單個Unicode字符
        if (char && char.length === 1 && !isNaN(count)) {
          charFreq[char] = count;
        }
      }
    }
    
    // 保存為JSON文件
    const outputPath = './public/data/charFrequency.json';
    fs.writeFileSync(outputPath, JSON.stringify(charFreq, null, 2), 'utf8');
    
    console.log(`轉換完成！共處理 ${Object.keys(charFreq).length} 個字符`);
    console.log(`數據已保存到 ${outputPath}`);
    
    // 顯示前10個最高頻字符
    const topChars = Object.entries(charFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.log('\n前10個最高頻字符：');
    topChars.forEach(([char, count], index) => {
      console.log(`${index + 1}. ${char}: ${count.toLocaleString()}`);
    });
  });
  
}).on('error', (err) => {
  console.error('下載錯誤:', err.message);
});
