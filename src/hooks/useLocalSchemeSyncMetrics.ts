/**
 * 本地方案自動同步 Hook
 *
 * 當 當前本地方案標識符 非空時，監聽各測評結果 atoms 的變化，
 * 自動將最新測評結果寫回 localStorage 中對應的本地方案條目。
 *
 * 性能說明：
 * - 當前方案配置（方案名等）通過 ref 持有最新值，不加入 effect 依賴，
 *   避免用戶在主頁每次輸入都觸發 localStorage 寫入。
 *   方案配置的持久化由 當前方案原子狀態（atomWithStorage）自身負責。
 * - 測評結果同步加 3000ms debounce，避免重算時多個結果依次完成導致連續寫入。
 *
 * 應在 MainLayout 中調用一次。
 */

import { useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 鍵位熱力分析原子狀態 } from '@/atoms/keyboardHeatmap'
import { 本地方案列表原子狀態, 當前本地方案標識符原子狀態 } from '@/atoms/localSchemes'

export function useLocalSchemeSyncMetrics() {
  const 當前本地方案標識符 = useAtomValue(當前本地方案標識符原子狀態)
  const 設置本地方案列表 = useSetAtom(本地方案列表原子狀態)

  // 用 ref 持有當前方案最新值，不加入 effect 依賴，
  // 避免主頁每次輸入都觸發 localStorage 寫入
  const 當前方案 = useAtomValue(當前方案原子狀態)
  const 當前方案Ref = useRef(當前方案)
  useEffect(() => {
    當前方案Ref.current = 當前方案
  })

  const 動態選重 = useAtomValue(動態選重分析原子狀態)
  const 靜態重碼 = useAtomValue(靜態重碼分析原子狀態)
  const 候選個數 = useAtomValue(候選個數分析原子狀態)
  const 速度當量 = useAtomValue(速度當量分析原子狀態)
  const 簡碼效率 = useAtomValue(簡碼效率分析原子狀態)
  const 鍵位熱力 = useAtomValue(鍵位熱力分析原子狀態)

  // 標識符剛切換時跳過一次，避免用空數據覆蓋剛恢復的結果
  const 上次激活標識符 = useRef<string | null>(null)
  // debounce timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!當前本地方案標識符) return

    // 剛切換到新的本地方案，跳過本次同步
    if (上次激活標識符.current !== 當前本地方案標識符) {
      上次激活標識符.current = 當前本地方案標識符
      return
    }

    // 清除上一個 debounce timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }

    // 3000ms 後才真正寫入，合併重算期間的多次觸發
    timerRef.current = setTimeout(() => {
      const 方案 = 當前方案Ref.current
      if (!方案) return

      設置本地方案列表(prev =>
        prev.map(條目 => {
          if (條目.元數據.標識符 !== 當前本地方案標識符) return 條目
          return {
            ...方案,
            測評結果: {
              ...方案.測評結果,
              動態選重分析: 動態選重 ?? undefined,
              靜態重碼分析: 靜態重碼 ?? undefined,
              候選個數分析: 候選個數 ?? undefined,
              速度當量分析: 速度當量 ?? undefined,
              簡碼效率分析: 簡碼效率 ?? undefined,
              鍵位熱力: 鍵位熱力 ?? undefined,
            },
          }
        })
      )
    }, 3000)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [當前本地方案標識符, 動態選重, 靜態重碼, 候選個數, 速度當量, 簡碼效率, 鍵位熱力])
}
