// 读取GB2312字符
import fs from 'fs';

// 读取各个字符集文件
const gb2312Text = fs.readFileSync('local/gb2312.txt', 'utf8');
const gbkText = fs.readFileSync('local/GBK.txt', 'utf8');
const commonText = fs.readFileSync('local/常用国字标准字体表.txt', 'utf8');
const generalText = fs.readFileSync('local/通用規範漢字表.txt', 'utf8');

// 解析字符
const gb2312Chars = [...gb2312Text].filter(char => char.trim() && /[\u4e00-\u9fff]/.test(char));
const gbkChars = gbkText.split('\n').filter(char => char.trim() && /[\u4e00-\u9fff]/.test(char));
const commonChars = [...commonText].filter(char => char.trim() && /[\u4e00-\u9fff]/.test(char));
const generalChars = generalText.split('\n').filter(line => line.trim() && !/^#/.test(line) && /[\u4e00-\u9fff]/.test(line)).map(line => line.trim());

console.log('GB2312字符数:', gb2312Chars.length);
console.log('GBK字符数:', gbkChars.length);
console.log('常用國字字符数:', commonChars.length);
console.log('通用規範漢字字符数:', generalChars.length);

// 创建字符集映射
const charsetData = {};

// 所有字符的集合
const allChars = new Set([...gb2312Chars, ...gbkChars, ...commonChars, ...generalChars]);

// 为每个字符创建记录
for (const char of allChars) {
  charsetData[char] = {
    is_gb2312: gb2312Chars.includes(char),
    is_gbk: gbkChars.includes(char),
    is_common_chinese: commonChars.includes(char),
    is_general_chinese: generalChars.includes(char)
  };
}

console.log('总字符数:', Object.keys(charsetData).length);

// 写入JSON文件
fs.writeFileSync('src/data/charsets.json', JSON.stringify(charsetData, null, 2), 'utf8');
console.log('字符集JSON文件已生成');
