/**
 * 本地方案自動同步 Hook
 *
 * 當 當前本地方案標識符 非空時，監聽當前方案配置和各測評結果 atoms 的變化，
 * 自動將最新內容（含方案名、標識符等所有配置）寫回 localStorage 中對應的本地方案條目。
 * 若用戶在首頁修改了標識符，同步更新 當前本地方案標識符 以保持一致。
 * 應在 MainLayout 中調用一次。
 */

import { useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom, useAtom } from 'jotai'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 鍵位熱力分析原子狀態 } from '@/atoms/keyboardHeatmap'
import { 本地方案列表原子狀態, 當前本地方案標識符原子狀態 } from '@/atoms/localSchemes'

export function useLocalSchemeSyncMetrics() {
  const [當前本地方案標識符, 設置當前本地方案標識符] = useAtom(當前本地方案標識符原子狀態)
  const 當前方案 = useAtomValue(當前方案原子狀態)
  const 設置本地方案列表 = useSetAtom(本地方案列表原子狀態)

  const 動態選重 = useAtomValue(動態選重分析原子狀態)
  const 靜態重碼 = useAtomValue(靜態重碼分析原子狀態)
  const 候選個數 = useAtomValue(候選個數分析原子狀態)
  const 速度當量 = useAtomValue(速度當量分析原子狀態)
  const 簡碼效率 = useAtomValue(簡碼效率分析原子狀態)
  const 鍵位熱力 = useAtomValue(鍵位熱力分析原子狀態)

  // 標識符剛切換時跳過一次，避免用空數據覆蓋剛恢復的結果
  const 上次激活標識符 = useRef<string | null>(null)

  useEffect(() => {
    if (!當前本地方案標識符 || !當前方案) return

    // 剛切換到新的本地方案，跳過本次同步
    if (上次激活標識符.current !== 當前本地方案標識符) {
      上次激活標識符.current = 當前本地方案標識符
      return
    }

    // 用 當前本地方案標識符 定位列表條目，整體替換為當前方案（含最新測評結果）
    // 若用戶修改了標識符，當前方案的標識符與激活標識符不同，
    // 需同時更新列表條目的 key 和 當前本地方案標識符
    const 新標識符 = 當前方案.元數據.標識符

    設置本地方案列表(prev =>
      prev.map(方案 => {
        if (方案.元數據.標識符 !== 當前本地方案標識符) return 方案
        return {
          ...當前方案,
          測評結果: {
            ...當前方案.測評結果,
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

    // 若標識符被用戶修改，更新激活標識符跟隨
    if (新標識符 !== 當前本地方案標識符) {
      設置當前本地方案標識符(新標識符)
      上次激活標識符.current = 新標識符
    }
  }, [當前本地方案標識符, 當前方案, 動態選重, 靜態重碼, 候選個數, 速度當量, 簡碼效率, 鍵位熱力])
}
