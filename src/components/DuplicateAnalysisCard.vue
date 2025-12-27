<template>
  <div ref="cardRef" class="duplicate-analysis-card" :id="id">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">重碼數據</h3>
          <p class="card-description">分析不同字符集下的重碼情况，計算靜態重碼率和動態選重率。閲讀<a href="https://shurufa.app/docs/concepts.html" target="_blank">瓊林擷英</a>瞭解詳細定義。</p>
        </div>
        <div class="header-buttons">
          <button @click="refreshData" class="refresh-btn" :disabled="isCalculating" title="刷新計算">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" :class="{ 'spinning': isCalculating }">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button @click="exportCard" class="export-btn" :disabled="isCalculating || !analysisResults" title="导出图片">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button @click="toggleCollapsed" class="collapse-button">
            <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-show="!isCollapsed" class="card-content">
      <div v-if="isCalculating" class="loading">
        <div class="spinner"></div>
        <p>正在計算重碼數據...</p>
      </div>

      <div v-else-if="analysisResults" class="analysis-results">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>指標</th>
              <th>全碼</th>
              <th>
                出簡
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算簡碼時，會提取碼表相同漢字中編碼長度最小之編碼，並視之爲簡碼。故而出現多重簡碼、兼容編碼、無理碼等特殊情况時，該列數據會出現失真現象。欲獲取更加準確之統計，請對碼表進行處理。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                知乎簡體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('zhihu', 'full')">{{ (analysisResults.dynamicDupRate.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('zhihu', 'short')">{{ (analysisResults.dynamicDupRate.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於<a href="https://github.com/forfudan/chinese-characters-frequency" target="_blank" rel="noopener">知乎字頻表</a>的加權選重率，‱ 爲萬分符</td>
            </tr>
            <tr>
              <td>
                北語簡體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('sc', 'full')">{{ (analysisResults.dynamicDupRateSC.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('sc', 'short')">{{ (analysisResults.dynamicDupRateSC.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於北京語言大學邢紅兵<a href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm" target="_blank" rel="noopener">簡體字頻表</a>的加權選重率</td>
            </tr>
            <tr>
              <td>
                臺標繁體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('tc', 'full')">{{ (analysisResults.dynamicDupRateTC.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('tc', 'short')">{{ (analysisResults.dynamicDupRateTC.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於<a href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm" target="_blank" rel="noopener">臺灣繁體字頻表</a>的加權選重率</td>
            </tr>
            <tr>
              <td>
                古籍繁體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('guji', 'full')">{{ (analysisResults.dynamicDupRateGuji.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('guji', 'short')">{{ (analysisResults.dynamicDupRateGuji.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於史書（史記、漢書、後漢書、三國志等）字頻的加權選重率</td>
            </tr>
            <tr>
              <td>
                繁簡聯合動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('unified', 'full')">{{ (analysisResults.dynamicDupRateUnified.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('unified', 'short')">{{ (analysisResults.dynamicDupRateUnified.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於繁簡聯合字頻表（北語字頻+臺標字頻）的加權選重率</td>
            </tr>
            <tr>
              <td>
                知乎簡體動重·原序
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('zhihu', 'full', false)">{{ (analysisResults.dynamicDupRateOriginal.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('zhihu', 'short', false)">{{ (analysisResults.dynamicDupRateOriginal.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於知乎字頻，保持碼表原始排序的加權選重率</td>
            </tr>
            <tr>
              <td>
                北語簡體動重·原序
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('sc', 'full', false)">{{ (analysisResults.dynamicDupRateSCOriginal.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('sc', 'short', false)">{{ (analysisResults.dynamicDupRateSCOriginal.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於北語字頻，保持碼表原始排序的加權選重率</td>
            </tr>
            <tr>
              <td>
                臺標繁體動重·原序
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('tc', 'full', false)">{{ (analysisResults.dynamicDupRateTCOriginal.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('tc', 'short', false)">{{ (analysisResults.dynamicDupRateTCOriginal.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於臺標字頻，保持碼表原始排序的加權選重率</td>
            </tr>
            <tr>
              <td>
                古籍繁體動重·原序
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('guji', 'full', false)">{{ (analysisResults.dynamicDupRateGujiOriginal.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('guji', 'short', false)">{{ (analysisResults.dynamicDupRateGujiOriginal.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於古籍字頻，保持碼表原始排序的加權選重率</td>
            </tr>
            <tr>
              <td>
                繁簡聯合動重·原序
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('unified', 'full', false)">{{ (analysisResults.dynamicDupRateUnifiedOriginal.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value clickable" @click="() => showDuplicateDetails('unified', 'short', false)">{{ (analysisResults.dynamicDupRateUnifiedOriginal.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於繁簡聯合字頻表（北語字頻+臺標字頻），保持碼表原始排序的加權選重率</td>
            </tr>
            <tr>
              <td>GB2312重碼組數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateGroups.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateGroups.short.toLocaleString() }}</td>
              <td class="metric-desc">GB2312字符集中的重碼組數</td>
            </tr>
            <tr>
              <td>通規重碼組數</td>
              <td class="metric-value">{{ analysisResults.tongguiDuplicateGroups.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.tongguiDuplicateGroups.short.toLocaleString() }}</td>
              <td class="metric-desc">通用規範漢字表字符集中的重碼組數</td>
            </tr>
            <tr>
              <td>國字重碼組數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateGroups.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateGroups.short.toLocaleString() }}</td>
              <td class="metric-desc">常用國字標準字體表字符集中的重碼組數</td>
            </tr>
            <tr>
              <td>GB2312重碼字數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.gb2312.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.gb2312?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>通規重碼字數</td>
              <td class="metric-value">{{ analysisResults.tongguiDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.tongguiDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.tonggui.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.tonggui?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>國字重碼字數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.guozi.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.guozi?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>CJK基本區重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkBasic.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkBasic?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>到CJK-A重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToA.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToA?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-B重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToB.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToB?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-C重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToC.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToC?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-D重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToD.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToD?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-E重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToE.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToE?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-F重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToF.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToF?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-G重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToG.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToG?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-H重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToH.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToH?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-I重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToI.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToI?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-J重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToJDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToJDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToJ.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToJ?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
          </tbody>
        </table>
        
        <div class="info-section">
          <p>💡<strong>提示：</strong>點擊動態選重率的數值，可查看具體需要選重的字符及其編碼詳情。</p>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>請點擊「重新計算」來查看分析結果</p>
      </div>
      
      <!-- 方案名稱標註 -->
      <div v-if="codeTableName" class="scheme-name-annotation">
        <span>當前方案：{{ codeTableName }}</span>
      </div>
    </div>
  </div>

  <!-- 自定義工具提示 - 使用 Teleport 移到 body -->
  <Teleport to="body">
    <div v-if="tooltipVisible" class="custom-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        {{ tooltipText }}
      </div>
    </div>
  </Teleport>

  <!-- 重碼詳情模態框 - 使用 Teleport 傳送到 body -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <div class="modal-header-actions">
            <button @click="exportToCSV" class="export-csv-btn" :disabled="duplicateDetails.length === 0" title="導出CVS">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              導出CVS
            </button>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
        </div>
        <div class="modal-body">
          <div v-if="isCalculatingDetails" class="modal-loading">
            <div class="spinner"></div>
            <p>正在計算重碼詳情...</p>
          </div>
          <div v-else-if="duplicateDetails.length > 0" class="details-table-wrapper">
            <table class="details-table">
              <thead>
                <tr>
                  <th class="col-index">#</th>
                  <th class="col-rank">字頻序數</th>
                  <th class="col-char">重碼字</th>
                  <th class="col-code">編碼</th>
                  <th class="col-freq">字頻</th>
                  <th class="col-chars">該編碼上的字符（字頻降序）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in duplicateDetails" :key="idx">
                  <td class="index-display">{{ idx + 1 }}</td>
                  <td class="rank-display">{{ item.rank }}</td>
                  <td class="duplicate-char">{{ item.char }}</td>
                  <td class="code-display">{{ item.code }}</td>
                  <td class="frequency">{{ (item.frequency / 1_000_000_000 * 10_000).toFixed(4) }}‱</td>
                  <td class="chars-on-code">
                    <span v-for="(char, i) in item.allCharsOnCode" :key="i" class="char-badge">{{ char }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-data">
            <p>無重碼數據</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, Teleport } from 'vue'
import { generateCharset, type CharsetType, getTheoreticalCharsetSize } from '../services/charsetService'
import { 
  getDynamicDupRate, 
  getDynamicDupRateFromOriginalOrder,
  getNonFirstDuplicateDetails,
  type NonFirstDuplicateDetail
} from '../services/duplicateAnalysisService'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { 
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyGuji,
  loadCharFrequencyUnified
} from '../services/dataService'
import { createTooltipManager } from '../services/uiService'
import { useCollapse } from '../composables/useCollapse'
import { ExportService } from '../services/exportService'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable?: CodeTable
  codeTableName?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map(),
  codeTableName: ''
})

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 卡片引用
const cardRef = ref<HTMLElement>()

// 导出功能
async function exportCard() {
  if (!cardRef.value || !analysisResults.value) {
    console.warn('卡片元素或数据不可用')
    return
  }

  try {
    await ExportService.exportElementToPNG(cardRef.value, '重碼數據', props.codeTableName || '未命名方案', {
      copyToClipboard: ExportService.isClipboardSupported(),
      download: true
    })
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  }
}

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 雙值數據結構
interface DualValue {
  full: number
  short: number
}

// 分析結果數據結構
interface AnalysisResults {
  dynamicDupRate: DualValue
  dynamicDupRateSC: DualValue
  dynamicDupRateTC: DualValue
  dynamicDupRateGuji: DualValue
  dynamicDupRateUnified: DualValue
  dynamicDupRateOriginal: DualValue
  dynamicDupRateSCOriginal: DualValue
  dynamicDupRateTCOriginal: DualValue
  dynamicDupRateGujiOriginal: DualValue
  dynamicDupRateUnifiedOriginal: DualValue
  gb2312DuplicateChars: DualValue
  tongguiDuplicateChars: DualValue
  guoziDuplicateChars: DualValue
  guoziDuplicateGroups: DualValue
  gb2312DuplicateGroups: DualValue
  tongguiDuplicateGroups: DualValue
  cjkBasicDuplicateChars: DualValue
  cjkToADuplicateChars: DualValue
  cjkToBDuplicateChars: DualValue
  cjkToCDuplicateChars: DualValue
  cjkToDDuplicateChars: DualValue
  cjkToEDuplicateChars: DualValue
  cjkToFDuplicateChars: DualValue
  cjkToGDuplicateChars: DualValue
  cjkToHDuplicateChars: DualValue
  cjkToIDuplicateChars: DualValue
  cjkToJDuplicateChars: DualValue
  charsetSizes: {
    gb2312: number
    tonggui: number
    guozi: number
    cjkBasic: number
    cjkToA: number
    cjkToB: number
    cjkToC: number
    cjkToD: number
    cjkToE: number
    cjkToF: number
    cjkToG: number
    cjkToH: number
    cjkToI: number
    cjkToJ: number
  }
  charsetEncodedSizes: {
    gb2312: number
    tonggui: number
    guozi: number
    cjkBasic: number
    cjkToA: number
    cjkToB: number
    cjkToC: number
    cjkToD: number
    cjkToE: number
    cjkToF: number
    cjkToG: number
    cjkToH: number
    cjkToI: number
    cjkToJ: number
  }
}

// 響應式數據
const isCalculating = ref(false)
const analysisResults = ref<AnalysisResults | null>(null)
const builtinService = new BuiltinCodeTableService()

// 工具提示管理器
const { tooltipVisible, tooltipText, tooltipStyle, showTooltip, hideTooltip } = createTooltipManager()

// 模態框相關
const showModal = ref(false)
const modalTitle = ref('')
const isCalculatingDetails = ref(false)
const duplicateDetails = ref<NonFirstDuplicateDetail[]>([])

// 顯示重碼詳情
async function showDuplicateDetails(freqType: string, codeType: 'full' | 'short', sortByFrequency: boolean = true) {
  const processedTables = codeTableProcessingService.getProcessedTables()
  if (!processedTables) return
  
  showModal.value = true
  isCalculatingDetails.value = true
  
  // 設置標題
  const freqNames: Record<string, string> = {
    zhihu: '知乎簡體字頻',
    sc: '北語簡體字頻',
    tc: '臺標繁體字頻',
    guji: '古籍繁體字頻',
    unified: '繁簡聯合字頻'
  }
  
  const codeNames: Record<string, string> = {
    full: '全碼',
    short: '出簡'
  }
  
  const sortInfo = sortByFrequency ? '按字頻排序' : '保持原序'
  modalTitle.value = `${freqNames[freqType]}·${codeNames[codeType]}·${sortInfo}`
  
  try {
    // 獲取對應的碼表
    const codeTable = codeType === 'full' ? processedTables.full : processedTables.short
    
    // 加載字頻
    const freqMap: Record<string, () => Promise<CharFrequency>> = {
      zhihu: loadCharFrequency,
      sc: loadCharFrequencySC,
      tc: loadCharFrequencyTC,
      guji: loadCharFrequencyGuji,
      unified: loadCharFrequencyUnified
    }
    
    const charFrequency = await freqMap[freqType]()
    
    // 計算重碼詳情
    duplicateDetails.value = getNonFirstDuplicateDetails(codeTable, charFrequency, sortByFrequency)
    
  } catch (err) {
    console.error('計算重碼詳情失敗:', err)
    duplicateDetails.value = []
  } finally {
    isCalculatingDetails.value = false
  }
}

// 關閉模態框
function closeModal() {
  showModal.value = false
  duplicateDetails.value = []
}

// 導出CSV
function exportToCSV() {
  if (duplicateDetails.value.length === 0) return
  
  // CSV 標題行
  const headers = ['#', '字頻序數', '重碼字', '編碼', '字頻', '該編碼上的字符（字頻降序）']
  
  // CSV 數據行
  const rows = duplicateDetails.value.map((item, idx) => [
    (idx + 1).toString(),
    item.rank.toString(),
    item.char,
    item.code,
    `${(item.frequency / 1_000_000_000 * 10_000).toFixed(2)}‱`,
    item.allCharsOnCode.join(' ')
  ])
  
  // 組合成 CSV 格式
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  // 創建 Blob 並下載
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${props.codeTableName || '未命名方案'}_重碼詳情_${modalTitle.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 計算字符集的重碼字符數和重碼組數（支持雙碼表）
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable, shortCodeTable: CodeTable) {
  // 生成實際有編碼的字符集（基於碼表中的字符）
  const actualCharset = await generateCharset(charsetType, allChars)
  
  // 獲取理論字符集大小
  let theoreticalSize = 0
  if (charsetType === 'gb2312' || charsetType === 'tonggui' || charsetType === 'guozi') {
    // 對於GB2312、通規和國字，從JSON文件獲取理論大小
    theoreticalSize = await getTheoreticalCharsetSize(charsetType)
  } else {
    // 對於CJK區域，生成完整的理論字符集
    theoreticalSize = await getTheoreticalCharsetSize(charsetType)
  }
  
  // 計算全碼表的重碼統計
  const fullCodeToChars = new Map<string, string[]>()
  let fullCodeTableMatches = 0
  
  for (const char of actualCharset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      fullCodeTableMatches++
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  let fullDuplicateGroups = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
      fullDuplicateGroups += 1
    }
  }
  
  // 計算簡碼表的重碼統計
  const shortCodeToChars = new Map<string, string[]>()
  let shortCodeTableMatches = 0
  
  for (const char of actualCharset) {
    const codes = shortCodeTable.get(char)
    if (codes && codes.length > 0) {
      shortCodeTableMatches++
      const code = codes[0]
      if (!shortCodeToChars.has(code)) {
        shortCodeToChars.set(code, [])
      }
      shortCodeToChars.get(code)!.push(char)
    }
  }
  
  let shortDuplicateChars = 0
  let shortDuplicateGroups = 0
  for (const chars of shortCodeToChars.values()) {
    if (chars.length > 1) {
      shortDuplicateChars += chars.length
      shortDuplicateGroups += 1
    }
  }
  
  return { 
    duplicateChars: { full: fullDuplicateChars, short: shortDuplicateChars },
    duplicateGroups: { full: fullDuplicateGroups, short: shortDuplicateGroups },
    theoreticalSize: theoreticalSize, // 理論字符集大小
    encodedSize: actualCharset.size // 實際有編碼的字符數
  }
}

// 生成累積CJK字符集緩存
async function generateCJKCharsetCache(allChars: Set<string>) {
  // 定義CJK擴展區順序
  const cjkExtensions = ['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f', 'cjk_g', 'cjk_h', 'cjk_i', 'cjk_j'] as const
  
  // 生成各個單獨的实际字符集
  const actualCharsets = await Promise.all(
    cjkExtensions.map(ext => generateCharset(ext, allChars))
  )
  
  // 創建累積实际字符集
  const cumulativeActualCharsets: { [key: string]: Set<string> } = {}
  
  // 爲每個階段創建正確的累積集合
  cjkExtensions.forEach((ext, index) => {
    const actualAccumulated = new Set<string>()
    
    // 累積到當前階段的所有字符
    for (let i = 0; i <= index; i++) {
      for (const char of actualCharsets[i]) {
        actualAccumulated.add(char)
      }
    }
    
    const targetName = ext === 'cjk_basic' ? 'cjkToBasic' : 
                      ext === 'cjk_a' ? 'cjkToA' :
                      ext === 'cjk_b' ? 'cjkToB' :
                      ext === 'cjk_c' ? 'cjkToC' :
                      ext === 'cjk_d' ? 'cjkToD' :
                      ext === 'cjk_e' ? 'cjkToE' :
                      ext === 'cjk_f' ? 'cjkToF' :
                      ext === 'cjk_g' ? 'cjkToG' :
                      ext === 'cjk_h' ? 'cjkToH' : 
                      ext === 'cjk_i' ? 'cjkToI' : 'cjkToJ'
    cumulativeActualCharsets[targetName] = actualAccumulated
  })
  
  return cumulativeActualCharsets as {
    cjkToBasic: Set<string>
    cjkToA: Set<string>
    cjkToB: Set<string>
    cjkToC: Set<string>
    cjkToD: Set<string>
    cjkToE: Set<string>
    cjkToF: Set<string>
    cjkToG: Set<string>
    cjkToH: Set<string>
    cjkToI: Set<string>
    cjkToJ: Set<string>
  }
}

// 計算字符集的重碼統計（直接使用字符集）
async function calculateDirectCharsetDuplicates(actualCharset: Set<string>, theoreticalSizeType: CharsetType, fullCodeTable: CodeTable, shortCodeTable: CodeTable) {
  // 獲取理論字符集大小
  const theoreticalSize = await getTheoreticalCharsetSize(theoreticalSizeType)
  
  // 計算全碼表的重碼統計
  const fullCodeToChars = new Map<string, string[]>()
  let fullCodeTableMatches = 0
  
  for (const char of actualCharset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      fullCodeTableMatches++
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  let fullDuplicateGroups = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
      fullDuplicateGroups += 1
    }
  }
  
  // 計算簡碼表的重碼統計
  const shortCodeToChars = new Map<string, string[]>()
  let shortCodeTableMatches = 0
  
  for (const char of actualCharset) {
    const codes = shortCodeTable.get(char)
    if (codes && codes.length > 0) {
      shortCodeTableMatches++
      const code = codes[0]
      if (!shortCodeToChars.has(code)) {
        shortCodeToChars.set(code, [])
      }
      shortCodeToChars.get(code)!.push(char)
    }
  }
  
  let shortDuplicateChars = 0
  let shortDuplicateGroups = 0
  for (const chars of shortCodeToChars.values()) {
    if (chars.length > 1) {
      shortDuplicateChars += chars.length
      shortDuplicateGroups += 1
    }
  }
  
  return { 
    duplicateChars: { full: fullDuplicateChars, short: shortDuplicateChars },
    duplicateGroups: { full: fullDuplicateGroups, short: shortDuplicateGroups },
    theoreticalSize: theoreticalSize,
    encodedSize: actualCharset.size
  }
}

// 刷新數據
const refreshData = async () => {
  console.log('手動刷新重碼數據...')
  await calculateAllMetrics()
}

// 計算所有指標
async function calculateAllMetrics() {
  if (!props.codeTable || props.codeTable.size === 0) {
    console.warn('没有可用的碼表數據')
    return
  }
  
  isCalculating.value = true
  
  try {
    // 从碼表键中提取所有单个字符（修复：處理多字词条问题）
    const allUniqueChars = new Set<string>()
    for (const key of props.codeTable.keys()) {
      // 将每个词条分解为单个字符
      for (const char of key) {
        allUniqueChars.add(char)
      }
    }
    
    // 使用提取的唯一字符代替原来的碼表键
    const allChars = allUniqueChars
    
    // 使用緩存的處理结果，由App.vue统一處理
    const processedTables = codeTableProcessingService.getProcessedTables()
    if (!processedTables) {
      console.error('緩存的碼表處理结果不可用，请先在App.vue中處理碼表')
      return
    }
    
    const fullCodeTable = processedTables.full
    const shortCodeTable = processedTables.short
    const fullWithSelectionTable = processedTables.fullWithSelection
    const shortWithSelectionTable = processedTables.shortWithSelection
    
    // 加載所有字頻數據
    const [charFrequency, charFrequencySC, charFrequencyTC, charFrequencyGuji, charFrequencyUnified] = await Promise.all([
      loadCharFrequency(),
      loadCharFrequencySC(),
      loadCharFrequencyTC(),
      loadCharFrequencyGuji(),
      loadCharFrequencyUnified()
    ])
    
    // 計算各種動態選重率（按字頻重新排序）
    const fullDynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
    const shortDynamicDupRate = getDynamicDupRate(shortCodeTable, charFrequency)
    
    const fullDynamicDupRateSC = getDynamicDupRate(fullCodeTable, charFrequencySC)
    const shortDynamicDupRateSC = getDynamicDupRate(shortCodeTable, charFrequencySC)
    
    const fullDynamicDupRateTC = getDynamicDupRate(fullCodeTable, charFrequencyTC)
    const shortDynamicDupRateTC = getDynamicDupRate(shortCodeTable, charFrequencyTC)
    
    const fullDynamicDupRateGuji = getDynamicDupRate(fullCodeTable, charFrequencyGuji)
    const shortDynamicDupRateGuji = getDynamicDupRate(shortCodeTable, charFrequencyGuji)
    
    const fullDynamicDupRateUnified = getDynamicDupRate(fullCodeTable, charFrequencyUnified)
    const shortDynamicDupRateUnified = getDynamicDupRate(shortCodeTable, charFrequencyUnified)
    
    // 計算各種動態選重率 - 原始排序（使用帶選重鍵的碼表）
    const fullDynamicDupRateOriginal = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequency)
    const shortDynamicDupRateOriginal = getDynamicDupRateFromOriginalOrder(shortWithSelectionTable, charFrequency)
    
    const fullDynamicDupRateSCOriginal = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencySC)
    const shortDynamicDupRateSCOriginal = getDynamicDupRateFromOriginalOrder(shortWithSelectionTable, charFrequencySC)
    
    const fullDynamicDupRateTCOriginal = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyTC)
    const shortDynamicDupRateTCOriginal = getDynamicDupRateFromOriginalOrder(shortWithSelectionTable, charFrequencyTC)
    
    const fullDynamicDupRateGujiOriginal = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyGuji)
    const shortDynamicDupRateGujiOriginal = getDynamicDupRateFromOriginalOrder(shortWithSelectionTable, charFrequencyGuji)
    
    const fullDynamicDupRateUnifiedOriginal = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyUnified)
    const shortDynamicDupRateUnifiedOriginal = getDynamicDupRateFromOriginalOrder(shortWithSelectionTable, charFrequencyUnified)
    
    // 計算各字符集的重碼統計
    const gb2312Stats = await calculateCharsetDuplicates('gb2312', allChars, fullCodeTable, shortCodeTable)
    const tongguiStats = await calculateCharsetDuplicates('tonggui', allChars, fullCodeTable, shortCodeTable)
    const guoziStats = await calculateCharsetDuplicates('guozi', allChars, fullCodeTable, shortCodeTable)
    const cjkBasicStats = await calculateCharsetDuplicates('cjk_basic', allChars, fullCodeTable, shortCodeTable)
    
    // 生成CJK累積字符集緩存
    const cjkCache = await generateCJKCharsetCache(allChars)
    
    // 使用緩存計算累積字符集的重碼統計
    const cjkExtNames = ['cjkToA', 'cjkToB', 'cjkToC', 'cjkToD', 'cjkToE', 'cjkToF', 'cjkToG', 'cjkToH', 'cjkToI', 'cjkToJ'] as const
    const cjkStats: Record<string, any> = {}
    for (const name of cjkExtNames) {
      const theoreticalSizeType = name === 'cjkToA' ? 'cjk_to_a' :
                                  name === 'cjkToB' ? 'cjk_to_b' :
                                  name === 'cjkToC' ? 'cjk_to_c' :
                                  name === 'cjkToD' ? 'cjk_to_d' :
                                  name === 'cjkToE' ? 'cjk_to_e' :
                                  name === 'cjkToF' ? 'cjk_to_f' :
                                  name === 'cjkToG' ? 'cjk_to_g' :
                                  name === 'cjkToH' ? 'cjk_to_h' : 
                                  name === 'cjkToI' ? 'cjk_to_i' : 'cjk_to_j'
      
      cjkStats[name] = await calculateDirectCharsetDuplicates(
        cjkCache[name], 
        theoreticalSizeType as CharsetType,
        fullCodeTable, 
        shortCodeTable
      )
    }
    
    // 構建 CJK 重碼字符結果
    const cjkDuplicateChars: any = {}
    cjkExtNames.forEach(name => {
      cjkDuplicateChars[`${name}DuplicateChars`] = cjkStats[name].duplicateChars
    })
    
    // 構建字符集大小結果
    const cjkCharsetSizes: any = {}
    cjkExtNames.forEach(name => {
      cjkCharsetSizes[name] = cjkStats[name].theoreticalSize
    })
    
    analysisResults.value = {
      dynamicDupRate: { full: fullDynamicDupRate, short: shortDynamicDupRate },
      dynamicDupRateSC: { full: fullDynamicDupRateSC, short: shortDynamicDupRateSC },
      dynamicDupRateTC: { full: fullDynamicDupRateTC, short: shortDynamicDupRateTC },
      dynamicDupRateGuji: { full: fullDynamicDupRateGuji, short: shortDynamicDupRateGuji },
      dynamicDupRateUnified: { full: fullDynamicDupRateUnified, short: shortDynamicDupRateUnified },
      dynamicDupRateOriginal: { full: fullDynamicDupRateOriginal, short: shortDynamicDupRateOriginal },
      dynamicDupRateSCOriginal: { full: fullDynamicDupRateSCOriginal, short: shortDynamicDupRateSCOriginal },
      dynamicDupRateTCOriginal: { full: fullDynamicDupRateTCOriginal, short: shortDynamicDupRateTCOriginal },
      dynamicDupRateGujiOriginal: { full: fullDynamicDupRateGujiOriginal, short: shortDynamicDupRateGujiOriginal },
      dynamicDupRateUnifiedOriginal: { full: fullDynamicDupRateUnifiedOriginal, short: shortDynamicDupRateUnifiedOriginal },
      gb2312DuplicateChars: gb2312Stats.duplicateChars,
      tongguiDuplicateChars: tongguiStats.duplicateChars,
      guoziDuplicateChars: guoziStats.duplicateChars,
      guoziDuplicateGroups: guoziStats.duplicateGroups,
      gb2312DuplicateGroups: gb2312Stats.duplicateGroups,
      tongguiDuplicateGroups: tongguiStats.duplicateGroups,
      cjkBasicDuplicateChars: cjkBasicStats.duplicateChars,
      ...cjkDuplicateChars,
      charsetSizes: {
        gb2312: gb2312Stats.theoreticalSize,
        tonggui: tongguiStats.theoreticalSize,
        guozi: guoziStats.theoreticalSize,
        cjkBasic: cjkBasicStats.theoreticalSize,
        ...cjkCharsetSizes
      },
      charsetEncodedSizes: (() => {
        const result: any = {}
        result.gb2312 = gb2312Stats.encodedSize
        result.tonggui = tongguiStats.encodedSize
        result.guozi = guoziStats.encodedSize
        result.cjkBasic = cjkBasicStats.encodedSize
        cjkExtNames.forEach(name => {
          result[name] = cjkStats[name].encodedSize
        })
        return result
      })()
    }
    
  } catch (error) {
    console.error('計算重碼時出錯:', error)
  } finally {
    isCalculating.value = false
  }
}

// 监听碼表变化
watch(() => props.codeTable, (newCodeTable) => {
  if (newCodeTable && newCodeTable.size > 0) {
    calculateAllMetrics()
  }
}, { immediate: true })

// 組件掛載時自動計算一次
onMounted(() => {
  if (props.codeTable && props.codeTable.size > 0) {
    calculateAllMetrics()
  }
})
</script>

<style scoped>
/* 原有样式 */
.card-description a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

.card-description a:hover {
  color: white;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.analysis-results {
  width: 100%;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics-table th,
.metrics-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8rem;
  line-height: 1.3;
}

.metrics-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-table th:first-child,
.metrics-table td:first-child {
  min-width: 140px;
}

.metrics-table tbody tr:hover {
  background: #f9fafb;
}

.metrics-table tbody tr:last-child td {
  border-bottom: none;
}

.metric-value {
  font-weight: 600;
  color: #059669;
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
}

.metric-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.info-icon {
  display: inline-block;
  margin-left: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: help;
  transition: color 0.2s ease;
  vertical-align: middle;
}

.info-icon:hover {
  color: #374151;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

.info-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  line-height: 1.6;
}

.info-section p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #374151;
}

.info-section ul {
  margin: 8px 0;
  padding-left: 24px;
}

.info-section li {
  margin: 4px 0;
  font-size: 0.875rem;
  color: #4b5563;
}

.info-section strong {
  font-weight: 600;
  color: #1f2937;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls {
    justify-content: center;
  }
  
  .metrics-table {
    font-size: 0.75rem;
  }
  
  .metrics-table th,
  .metrics-table td {
    padding: 6px 8px;
    font-size: 0.7rem;
  }
}

/* 自定義工具提示樣式 */
.custom-tooltip {
  position: fixed;
  background: #1f2937;
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  z-index: 9999;
  pointer-events: none;
  line-height: 1.5;
}

.tooltip-content {
  display: block;
}

/* 方案名稱標註樣式 */
.scheme-name {
  margin-top: 16px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
}

.scheme-name span {
  font-size: 0.85rem;
  color: #4a5568;
  font-weight: 500;
}

/* 暗黑模式專用樣式 */
[data-theme="dark"] .metrics-table {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .metrics-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .metrics-table td {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-secondary);
}

[data-theme="dark"] .metrics-table tbody tr:hover {
  background: var(--color-bg-tertiary);
}

[data-theme="dark"] .metric-value {
  color: var(--color-success);
}

[data-theme="dark"] .metric-desc {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .info-icon {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .info-icon:hover {
  color: var(--color-text-primary);
}

[data-theme="dark"] .empty-state {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .empty-state p {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .info-section {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .info-section p {
  color: var(--color-text-primary);
}

[data-theme="dark"] .info-section li {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .info-section strong {
  color: var(--color-text-primary);
}

[data-theme="dark"] .scheme-name {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .scheme-name span {
  color: var(--color-text-secondary);
}

/* 可點擊的數值樣式 */
.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

/* 模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-csv-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-csv-btn:hover:not(:disabled) {
  background: #2563eb;
}

.export-csv-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.export-csv-btn svg {
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #9ca3af;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #666;
}

.details-table-wrapper {
  overflow-x: auto;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.details-table th {
  background: #f8fafc;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  white-space: nowrap;
  font-size: 0.85rem;
}

.details-table td {
  padding: 6px 10px;
  vertical-align: middle;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

/* 列宽控制 */
.col-index {
  width: 50px;
}

.col-rank {
  width: 60px;
}

.col-char {
  width: 70px;
}

.col-code {
  width: 100px;
}

.col-freq {
  width: 90px;
}

.col-chars {
  width: auto;
  min-width: 200px;
}

.details-table tbody tr:last-child td {
  border-bottom: none;
}

.details-table tbody tr:hover {
  background: #f9fafb;
}

.index-display {
  font-family: var(--font-numeric);
  font-weight: 500;
  color: #9ca3af;
  text-align: left;
  white-space: nowrap;
  font-size: 0.85rem;
}

.rank-display {
  font-family: var(--font-numeric);
  font-weight: 600;
  color: #6b7280;
  text-align: left;
  white-space: nowrap;
}

.details-table .duplicate-char {
  font-size: 1.5rem !important;
  font-weight: 600;
  color: #1f2937;
  text-align: left;
  line-height: 1.2;
}

.code-display {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #059669;
  font-weight: 600;
  white-space: nowrap;
}

.frequency {
  font-weight: 600;
  color: #3b82f6;
  font-family: var(--font-numeric);
  white-space: nowrap;
  text-align: left;
  font-size: 0.85rem;
}

.chars-on-code {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.char-badge {
  display: inline-block;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

/* 暗黑模式的模態框樣式 */
[data-theme="dark"] .modal-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .modal-header {
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .modal-header h3 {
  color: var(--color-text-primary);
}

[data-theme="dark"] .modal-close {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .modal-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .export-csv-btn {
  background: #3b82f6;
}

[data-theme="dark"] .export-csv-btn:hover:not(:disabled) {
  background: #2563eb;
}

[data-theme="dark"] .export-csv-btn:disabled {
  background: #4b5563;
}

[data-theme="dark"] .modal-loading {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .details-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .details-table td {
  border-bottom-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .details-table tbody tr:hover {
  background: var(--color-bg-tertiary);
}

[data-theme="dark"] .index-display {
  color: var(--color-text-tertiary);
}

[data-theme="dark"] .rank-display {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .details-table .duplicate-char {
  color: var(--color-text-primary);
}

[data-theme="dark"] .char-badge {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .no-data {
  color: var(--color-text-secondary);
}
</style>
