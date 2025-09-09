#!/bin/bash

# 臺灣繁體到大陸通規繁體字轉換腳本

echo "開始轉換臺灣繁體字到大陸通規繁體字..."

# 定義要處理的目錄
DIRS=("src" "docs")

# 計數器
total_files=0
converted_files=0

# 遍歷目錄並處理 .vue 和 .ts 文件
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "處理目錄: $dir"
        for file in $(find "$dir" -name "*.vue" -o -name "*.ts"); do
            echo "檢查文件: $file"
            total_files=$((total_files + 1))
            
            # 創建臨時文件
            temp_file=$(mktemp)
            changed=false
            
            # 逐行讀取並替換
            while IFS= read -r line; do
                original_line="$line"
                
                # 完整繁體字轉換（基於 convert_tw_to_tonggui.sh）
                line=$(echo "$line" | sed \
                    -e 's/羣/群/g' \
                    -e 's/峯/峰/g' \
                    -e 's/脈/脉/g' \
                    -e 's/貓/猫/g' \
                    -e 's/廈/厦/g' \
                    -e 's/蝨/虱/g' \
                    -e 's/諡/謚/g' \
                    -e 's/夠/够/g' \
                    -e 's/別/别/g' \
                    -e 's/著/着/g' \
                    -e 's/裡/裏/g' \
                    -e 's/戶/户/g' \
                    -e 's/沒/没/g' \
                    -e 's/歿/殁/g' \
                    -e 's/絕/絶/g' \
                    -e 's/勻/匀/g' \
                    -e 's/丟/丢/g' \
                    -e 's/袞/衮/g' \
                    -e 's/滾/滚/g' \
                    -e 's/撐/撑/g' \
                    -e 's/囪/囱/g' \
                    -e 's/禿/秃/g' \
                    -e 's/頹/頽/g' \
                    -e 's/粵/粤/g' \
                    -e 's/剎/刹/g' \
                    -e 's/弒/弑/g' \
                    -e 's/恥/耻/g' \
                    -e 's/毀/毁/g' \
                    -e 's/拋/抛/g' \
                    -e 's/況/况/g' \
                    -e 's/罵/駡/g' \
                    -e 's/荊/荆/g' \
                    -e 's/蒞/莅/g' \
                    -e 's/嫺/嫻/g' \
                    -e 's/溼/濕/g' \
                    -e 's/祕/秘/g' \
                    -e 's/抬/擡/g' \
                    -e 's/奖/奬/g' \
                    -e 's/詠/咏/g' \
                    -e 's/彥/彦/g' \
                    -e 's/顏/顔/g' \
                    -e 's/產/産/g' \
                    -e 's/搖/摇/g' \
                    -e 's/遙/遥/g' \
                    -e 's/瑤/瑶/g' \
                    -e 's/謠/謡/g' \
                    -e 's/兌/兑/g' \
                    -e 's/說/説/g' \
                    -e 's/悅/悦/g' \
                    -e 's/挩/捝/g' \
                    -e 's/敓/敚/g' \
                    -e 's/稅/税/g' \
                    -e 's/脫/脱/g' \
                    -e 's/涗/涚/g' \
                    -e 's/梲/棁/g' \
                    -e 's/閱/閲/g' \
                    -e 's/蛻/蜕/g' \
                    -e 's/銳/鋭/g' \
                    -e 's/虛/虚/g' \
                    -e 's/噓/嘘/g' \
                    -e 's/麼/麽/g' \
                    -e 's/嬤/嬷/g' \
                    -e 's/𢣗/懡/g' \
                    -e 's/冊/册/g' \
                    -e 's/刪/删/g' \
                    -e 's/姍/姗/g' \
                    -e 's/柵/栅/g' \
                    -e 's/內/内/g' \
                    -e 's/吶/呐/g' \
                    -e 's/為/爲/g' \
                    -e 's/偽/僞/g' \
                    -e 's/吳/吴/g' \
                    -e 's/綠/緑/g' \
                    -e 's/錄/録/g' \
                    -e 's/剝/剥/g' \
                    -e 's/黃/黄/g' \
                )
                
                if [ "$original_line" != "$line" ]; then
                    changed=true
                fi
                
                echo "$line" >> "$temp_file"
            done < "$file"
            
            # 如果有變化，則更新文件
            if [ "$changed" = true ]; then
                mv "$temp_file" "$file"
                converted_files=$((converted_files + 1))
                echo "  -> 已轉換"
            else
                rm "$temp_file"
            fi
        done
    else
        echo "警告: 目錄 $dir 不存在，跳過"
    fi
done

echo ""
echo "轉換完成！"
echo "總共處理文件: $total_files"
echo "轉換文件數量: $converted_files"
echo ""
