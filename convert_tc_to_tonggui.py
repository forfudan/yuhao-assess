#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据 tw2c.txt 的对应关系，将 charFrequencyTC.json 中的台湾用字转换为大陆通规用字
"""

import json

def load_mapping_table(file_path):
    """加载 tw2c.txt 中的字符对应关系"""
    mapping = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            
            # 跳过注释行和空行
            if line.startswith('#') or not line:
                continue
            
            # 分割台湾用字和大陆用字
            parts = line.split('\t')
            if len(parts) >= 2:
                tw_char = parts[0].strip()
                mainland_char = parts[1].strip()
                
                # 只有当两个字符都不为空时才添加映射
                if tw_char and mainland_char:
                    mapping[tw_char] = mainland_char
    
    return mapping

def convert_frequency_table(input_file, output_file, mapping):
    """转换字频表"""
    # 读取原始字频表
    with open(input_file, 'r', encoding='utf-8') as f:
        original_freq = json.load(f)
    
    # 创建新的字频表
    new_freq = {}
    conversion_log = []
    
    for char, freq in original_freq.items():
        if char in mapping:
            # 如果字符在映射表中，使用对应的大陆字符
            mainland_char = mapping[char]
            
            # 如果大陆字符已经存在，累加频率
            if mainland_char in new_freq:
                new_freq[mainland_char] += freq
                conversion_log.append(f"合并: {char} + {mainland_char} (已存在) -> {mainland_char} (频率: {new_freq[mainland_char]})")
            else:
                new_freq[mainland_char] = freq
                conversion_log.append(f"转换: {char} -> {mainland_char} (频率: {freq})")
        else:
            # 如果字符不在映射表中，保持原样
            if char in new_freq:
                new_freq[char] += freq
            else:
                new_freq[char] = freq
    
    # 按频率降序排序
    sorted_freq = dict(sorted(new_freq.items(), key=lambda x: x[1], reverse=True))
    
    # 保存新的字频表
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sorted_freq, f, ensure_ascii=False, indent=2)
    
    # 输出转换日志
    print("转换完成！")
    print(f"原始字符数: {len(original_freq)}")
    print(f"转换后字符数: {len(sorted_freq)}")
    print(f"发生转换的字符数: {len([log for log in conversion_log if '转换:' in log])}")
    print(f"发生合并的字符数: {len([log for log in conversion_log if '合并:' in log])}")
    
    # 显示一些转换示例
    print("\n转换示例:")
    for log in conversion_log[:10]:  # 只显示前10个
        print(f"  {log}")
    
    if len(conversion_log) > 10:
        print(f"  ... 还有 {len(conversion_log) - 10} 个转换")

def main():
    # 文件路径
    mapping_file = "public/data/tw2c.txt"
    input_file = "public/data/charFrequencyTC.json"
    output_file = "public/data/charFrequencyTongguiTC.json"
    
    try:
        # 加载映射表
        print("正在加载字符映射表...")
        mapping = load_mapping_table(mapping_file)
        print(f"加载了 {len(mapping)} 个字符映射关系")
        
        # 显示一些映射示例
        print("\n映射示例:")
        for i, (tw, mainland) in enumerate(mapping.items()):
            if i < 10:  # 只显示前10个
                print(f"  {tw} -> {mainland}")
        if len(mapping) > 10:
            print(f"  ... 还有 {len(mapping) - 10} 个映射")
        
        # 转换字频表
        print("\n正在转换字频表...")
        convert_frequency_table(input_file, output_file, mapping)
        
        print(f"\n转换完成！输出文件: {output_file}")
        
    except FileNotFoundError as e:
        print(f"错误: 找不到文件 {e.filename}")
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    main()
