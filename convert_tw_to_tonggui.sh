#!/bin/bash

# 台湾繁体到大陆通规繁体字转换脚本
# 基于 docs/tw_to_tonggui.md 文件中没有 > 前缀的对应关系

echo "开始转换台湾繁体字到大陆通规繁体字..."

# 定义要处理的目录
DIRS=("src/components" "src/services")

# 台湾繁体 -> 大陆通规繁体 对应表（只包含没有 > 前缀的行）
declare -A REPLACEMENTS=(
    ["羣"]="群"
    ["峯"]="峰"
    ["脈"]="脉"
    ["貓"]="猫"
    ["廈"]="厦"
    ["蝨"]="虱"
    ["諡"]="謚"
    ["夠"]="够"
    ["別"]="别"
    ["著"]="着"
    ["裡"]="裏"
    ["戶"]="户"
    ["沒"]="没"
    ["歿"]="殁"
    ["絕"]="絶"
    ["勻"]="匀"
    ["丟"]="丢"
    ["袞"]="衮"
    ["滾"]="滚"
    ["撐"]="撑"
    ["囪"]="囱"
    ["禿"]="秃"
    ["頹"]="頽"
    ["粵"]="粤"
    ["剎"]="刹"
    ["弒"]="弑"
    ["恥"]="耻"
    ["毀"]="毁"
    ["拋"]="抛"
    ["況"]="况"
    ["罵"]="駡"
    ["荊"]="荆"
    ["蒞"]="莅"
    ["嫺"]="嫻"
    ["溼"]="濕"
    ["祕"]="秘"
    ["抬"]="擡"
    ["奖"]="奬"
    ["詠"]="咏"
    ["彥"]="彦"
    ["顏"]="顔"
    ["產"]="産"
    ["搖"]="摇"
    ["遙"]="遥"
    ["瑤"]="瑶"
    ["謠"]="謡"
    ["兌"]="兑"
    ["說"]="説"
    ["悅"]="悦"
    ["挩"]="捝"
    ["敓"]="敚"
    ["稅"]="税"
    ["脫"]="脱"
    ["涗"]="涚"
    ["梲"]="棁"
    ["閱"]="閲"
    ["蛻"]="蜕"
    ["銳"]="鋭"
    ["虛"]="虚"
    ["噓"]="嘘"
    ["麼"]="麽"
    ["嬤"]="嬷"
    ["𢣗"]="懡"
    ["冊"]="册"
    ["刪"]="删"
    ["姍"]="姗"
    ["柵"]="栅"
    ["內"]="内"
    ["吶"]="呐"
    ["為"]="爲"
    ["偽"]="僞"
    ["吳"]="吴"
    ["綠"]="緑"
    ["錄"]="録"
    ["剝"]="剥"
    ["黃"]="黄"
)

# 计数器
total_files=0
converted_files=0

# 遍历每个目录
for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "警告: 目录 $dir 不存在，跳过"
        continue
    fi
    
    echo "处理目录: $dir"
    
    # 查找所有 .vue, .ts, .js, .md 文件
    while IFS= read -r -d '' file; do
        total_files=$((total_files + 1))
        file_changed=false
        
        # 对每个文件应用所有替换规则
        for tw_char in "${!REPLACEMENTS[@]}"; do
            tonggui_char="${REPLACEMENTS[$tw_char]}"
            
            # 检查文件是否包含要替换的字符
            if grep -q "$tw_char" "$file" 2>/dev/null; then
                # 执行替换
                sed -i '' "s/$tw_char/$tonggui_char/g" "$file"
                file_changed=true
            fi
        done
        
        if [ "$file_changed" = true ]; then
            converted_files=$((converted_files + 1))
            echo "  ✓ 已转换: $(basename "$file")"
        fi
        
    done < <(find "$dir" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" -o -name "*.md" \) -print0)
done

echo ""
echo "转换完成！"
echo "总共处理文件: $total_files"
echo "转换文件数量: $converted_files"
echo ""
echo "主要转换内容："
echo "  為 → 爲"
echo "  說 → 説"
echo "  內 → 内"
echo "  沒 → 没"
echo "  裡 → 裏"
echo "  別 → 别"
echo "  綠 → 緑"
echo "  顏 → 顔"
echo "  閱 → 閲"
echo "  錄 → 録"
echo "  產 → 産"
echo "  黃 → 黄"
echo "  等等..."
echo ""
echo "请检查转换结果，如有问题可以使用 git checkout 恢复。"
