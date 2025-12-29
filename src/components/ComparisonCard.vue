<template>
  <div ref="cardRef" class="comparison-card" v-bind="$attrs">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">方案對比</h3>
          <p class="card-description">對比不同輸入法方案的各項數據，支持預設方案和文件上傳。</p>
        </div>
        <div class="header-buttons">
          <button @click="exportCard" class="export-btn" :disabled="!hasAnyScheme" title="導出圖片">
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
      <div v-if="!hasAnyScheme" class="empty-state">
        <div class="empty-icon">📊</div>
        <h4>開始方案對比</h4>
        <p>添加多個輸入法方案進行對比分析</p>
        <button @click="showAddForm = true" class="primary-btn">添加第一個方案</button>
      </div>
      
      <div v-else>
        <!-- Tab 切換器 -->
        <div class="tabs-container">
          <div class="tab-list">
            <button 
              v-for="tab in tabs" 
              :key="tab.key"
              :class="['tab-button', { 'active': activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          
          <!-- 後台計算進度指示器 -->
          <div v-if="hasBackgroundTasks" class="background-progress">
            <div class="progress-info">
              <span class="progress-text">{{ progressText }}</span>
              <span class="progress-percentage">{{ backgroundProgress.percentage }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: backgroundProgress.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 對比表格 -->
        <div class="comparison-table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="scheme-name-header sortable" @click="handleSort('name')">
                  <div class="header-content">
                    <span>方案名稱</span>
                    <span class="sort-arrow">{{ getSortArrow('name') }}</span>
                  </div>
                </th>
                <th class="char-count-header sortable" @click="handleSort('charCount')">
                  <div class="header-content">
                    <span>收字</span>
                    <span class="sort-arrow">{{ getSortArrow('charCount') }}</span>
                  </div>
                </th>
                
                <!-- 動態選重 Tab 的列 -->
                <template v-if="activeTab === 'dynamic'">
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRate')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>知乎字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRate') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateSC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>北語字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateSC') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateTC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>臺標字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateTC') }}</span>
                      </div>
                      <small>繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateGuji')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>古籍字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateGuji') }}</span>
                      </div>
                      <small>繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateUnified')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>繁簡聯合</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateUnified') }}</span>
                      </div>
                      <small>繁簡聯合字頻</small>
                    </div>
                  </th>
                </template>
                
                <!-- 原始動態選重 Tab 的列 -->
                <template v-else-if="activeTab === 'dynamicOriginal'">
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRate')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>知乎字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRate') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateSC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>北語字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateSC') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateTC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>臺標字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateTC') }}</span>
                      </div>
                      <small>繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateGuji')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>古籍字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateGuji') }}</span>
                      </div>
                      <small>繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateUnified')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>繁簡聯合</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateUnified') }}</span>
                      </div>
                      <small>繁簡聯合字頻</small>
                    </div>
                  </th>
                </template>
                
                <!-- 靜態重碼 Tab 的列 -->
                <template v-else-if="activeTab === 'static'">
                  <th class="metric-header sortable" @click="handleSort('gb2312DuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>GB2312</span>
                        <span class="sort-arrow">{{ getSortArrow('gb2312DuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('tongguiDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>通規</span>
                        <span class="sort-arrow">{{ getSortArrow('tongguiDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('guoziDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>國字常用</span>
                        <span class="sort-arrow">{{ getSortArrow('guoziDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkBasicDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>CJK基本</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkBasicDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToBDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-B</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToBDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToJDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-J</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToJDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                </template>
                
                <!-- 最大候選 Tab 的列 -->
                <template v-else-if="activeTab === 'maxCandidates'">
                  <th class="metric-header sortable" @click="handleSort('gb2312MaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>GB2312</span>
                        <span class="sort-arrow">{{ getSortArrow('gb2312MaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('guoziMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>國字常用</span>
                        <span class="sort-arrow">{{ getSortArrow('guoziMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkBasicMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>CJK基本</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkBasicMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToBMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-B</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToBMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToJMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-J</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToJMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                </template>
                
                <!-- 速度當量 Tab 的列 -->
                <template v-else-if="activeTab === 'speedEquiv'">
                  <th class="metric-header sortable" @click="handleSort('zhihuEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>知乎字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('zhihuEquiv') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('scEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>北語字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('scEquiv') }}</span>
                      </div>
                      <small>簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('tcEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>臺標字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('tcEquiv') }}</span>
                      </div>
                      <small>繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('gujiEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>古籍字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('gujiEquiv') }}</span>
                      </div>
                      <small>古籍字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('unifiedEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>繁簡字頻</span>
                        <span class="sort-arrow">{{ getSortArrow('unifiedEquiv') }}</span>
                      </div>
                      <small>繁簡聯合字頻</small>
                    </div>
                  </th>
                </template>
                <th class="actions-header">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(scheme, index) in visibleSchemes" :key="scheme.id" class="scheme-row">
                <td class="scheme-name">
                  <div class="scheme-info">
                    <span 
                      class="scheme-title"
                      @mouseenter="showTooltip($event, scheme)"
                      @mouseleave="hideTooltip"
                    >
                      {{ scheme.name }}
                    </span>
                  </div>
                </td>
                <td class="char-count">
                  <span class="metric-value">
                    {{ formatNumber(scheme.charCount) }}
                  </span>
                </td>
                
                <!-- 動態選重 Tab 的數據列 -->
                <template v-if="activeTab === 'dynamic'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRate) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateSC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateTC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateGuji) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateUnified) }}
                    </span>
                  </td>
                </template>
                
                <!-- 原始動態選重 Tab 的數據列 -->
                <template v-else-if="activeTab === 'dynamicOriginal'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamicOriginal?.dynamicDupRate) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamicOriginal?.dynamicDupRateSC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamicOriginal?.dynamicDupRateTC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamicOriginal?.dynamicDupRateGuji) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamicOriginal?.dynamicDupRateUnified) }}
                    </span>
                  </td>
                </template>
                
                <!-- 靜態重碼 Tab 的數據列 -->
                <template v-else-if="activeTab === 'static'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.gb2312DuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.tongguiDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.guoziDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkBasicDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToBDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToJDuplicateChars) }}
                    </span>
                  </td>
                </template>
                
                <!-- 最大候選 Tab 的數據列 -->
                <template v-else-if="activeTab === 'maxCandidates'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.gb2312MaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.guoziMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkBasicMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToBMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToJMaxCount) }}
                    </span>
                  </td>
                </template>
                
                <!-- 速度當量 Tab 的數據列 -->
                <template v-else-if="activeTab === 'speedEquiv'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.zhihuEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.scEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.tcEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.gujiEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.unifiedEquiv) }}
                    </span>
                  </td>
                </template>
                <td class="actions-cell">
                  <button 
                    v-if="!scheme.isBuiltin && !scheme.rawCodeTable"
                    @click="reuploadScheme(scheme)" 
                    class="reupload-btn"
                    title="重新上傳此方案的碼表文件"
                  >
                    📤
                  </button>
                  <button 
                    v-else
                    @click="recalculateScheme(scheme)" 
                    class="refresh-btn"
                    :disabled="scheme.isCalculating"
                    title="重新計算此方案的數據"
                  >
                    🔄
                  </button>
                  <button 
                    v-if="canRemoveScheme(scheme)" 
                    @click="removeScheme(scheme)" 
                    class="remove-btn"
                    title="移除此方案"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 隱藏方案提示 -->
        <div v-if="hiddenSchemesCount > 0" class="hidden-schemes-notice">
          <div class="notice-icon">ℹ️</div>
          <span class="notice-text">已隱藏 {{ hiddenSchemesCount }} 個無效方案 (或未選擇主方案)</span>
        </div>

        <!-- 添加方案按鈕 -->
        <div class="add-scheme-section">
          <button 
            @click="showAddForm = true" 
            class="add-scheme-btn"
            :disabled="isAdding"
          >
            <span v-if="isAdding">
              <span v-if="uploadProgress.total > 0">
                上傳中 {{ uploadProgress.current }}/{{ uploadProgress.total }}...
              </span>
              <span v-else>添加中...</span>
            </span>
            <span v-else>➕ 添加新方案</span>
          </button>
          
          <!-- 清除所有方案按鈕 -->
          <button 
            v-if="additionalSchemes.length > 0"
            @click="clearAllSchemes" 
            class="clear-all-btn"
            title="清除所有額外添加的方案"
          >
            🗑️ 清除全部
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加方案表單 - 使用 Teleport 確保浮在最上層 -->
  <Teleport to="body">
    <div v-if="showAddForm" class="add-form-overlay">
      <div class="add-form">
        <div class="form-header">
          <h4>添加對比方案</h4>
          <button @click="cancelAdd" class="close-btn">✕</button>
        </div>
        
        <div class="form-content">
          <!-- 預設方案選項 -->
          <div class="form-section">
            <h5>預設方案</h5>
            <p class="section-desc">選擇預設的輸入法方案（支持多選）</p>
            <div class="builtin-options">
              <!-- 多選方案列表 -->
              <div class="multi-select-container">
                <div class="select-all-controls">
                  <button 
                    @click="selectAllBuiltinSchemes" 
                    :disabled="isAdding || availableBuiltinSchemes.length === 0"
                    class="select-all-btn"
                  >
                    全選
                  </button>
                  <button 
                    @click="clearSelectedBuiltinSchemes" 
                    :disabled="isAdding || selectedBuiltinSchemes.length === 0"
                    class="clear-selection-btn"
                  >
                    清空選擇
                  </button>
                  <span class="selection-count">已選: {{ selectedBuiltinSchemes.length }}</span>
                </div>
                
                <div class="scheme-checkboxes">
                  <label 
                    v-for="scheme in availableBuiltinSchemes" 
                    :key="scheme.id" 
                    class="scheme-checkbox"
                  >
                    <input 
                      type="checkbox" 
                      :value="scheme.id"
                      v-model="selectedBuiltinSchemes"
                      :disabled="isAdding"
                      class="checkbox-input"
                    >
                    <span class="checkbox-label">{{ scheme.name }}</span>
                  </label>
                </div>
              </div>
              
              <div class="batch-add-controls">
                <button 
                  @click="addSelectedBuiltinSchemes" 
                  :disabled="isAdding || selectedBuiltinSchemes.length === 0"
                  class="add-selected-btn"
                >
                  添加選中方案 ({{ selectedBuiltinSchemes.length }})
                </button>
              </div>
            </div>
          </div>

          <div class="form-divider">
            <span>或</span>
          </div>

          <!-- 文件上傳選項 -->
          <div class="form-section">
            <h5>上傳碼表文件</h5>
            <p class="section-desc">選擇碼表格式並上傳 .txt 或 .csv 文件（支持多文件選擇）</p>
            
            <!-- 前綴碼選項 -->
            <div class="prefix-toggle-section">
              <label class="prefix-toggle">
                <input 
                  type="checkbox" 
                  v-model="uploadPrefixFlag"
                  class="prefix-checkbox"
                >
                <span class="prefix-label">我是前綴或頂功方案</span>
                <span class="prefix-desc">（勾選即表示上傳的是前綴或頂功方案，影響空格鍵頻率計算）</span>
              </label>
            </div>
            
            <div class="upload-area">
              <input 
                ref="fileInputCharCode"
                type="file" 
                @change="(e) => handleMultipleFileUpload(e, 'char_first')" 
                accept=".txt,.csv"
                class="file-input"
                :disabled="isAdding"
                multiple
                style="display: none;"
              >
              <input 
                ref="fileInputCodeChar"
                type="file" 
                @change="(e) => handleMultipleFileUpload(e, 'code_first')" 
                accept=".txt,.csv"
                class="file-input"
                :disabled="isAdding"
                multiple
                style="display: none;"
              >
              <div class="upload-buttons">
                <button 
                  @click="triggerFileUpload('char_first')" 
                  class="upload-btn"
                  :disabled="isAdding"
                >
                  📁 漢字-編碼格式 (多選)
                </button>
                <button 
                  @click="triggerFileUpload('code_first')" 
                  class="upload-btn"
                  :disabled="isAdding"
                >
                  📁 編碼-漢字格式 (多選)
                </button>
              </div>
              <div class="upload-tips">
                <small>💡 提示：可以按住 Ctrl/Cmd 鍵選擇多個文件，或按住 Shift 鍵選擇連續的文件</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Custom Tooltip -->
  <div 
    v-show="tooltip.show" 
    class="custom-tooltip"
    :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
  >
    {{ tooltip.text }}
  </div>
</template>

<script setup lang="ts">
// 禁用自動屬性繼承，因爲我們有多個根節點（包括 Teleport）
defineOptions({
  inheritAttrs: false
})

import { ref, computed, onMounted, onUnmounted, watch, nextTick, Teleport } from 'vue'
import { ExportService } from '../services/exportService'
import { generateCharset, type CharsetType, getTheoreticalCharsetSize } from '../services/charsetService'
import { getDynamicDupRate, getDynamicDupRateFromOriginalOrder } from '../services/duplicateAnalysisService'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { 
  calculateCharCount as calculateCharCountService, 
  calculateCharCountFromRaw,
  calculateAllMaxCandidates, 
  calculateStaticDuplicates, 
  clearCache 
} from '../services/calculationService'
import type { RawCodeTable, ProcessedCodeTables } from '../types'
import { 
  formatRate, 
  formatNumber, 
  formatEquiv
} from '../services/uiService'
import {
  loadAllCharFrequencies,
  getFrequencyCharsUnion
} from '../services/dataService'
import {
  calculateSpeedEquivFromCodeTable,
  calculateCodePairFrequencies
} from '../services/speedAnalysisService'
import {
  getAllMaximumCandidates,
  type MaximumCandidatesResult
} from '../services/maximumCandidatesService'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  currentCodeTable?: CodeTable | null
  currentCodeTableName?: string
  globalPrefixKeys?: string[]
  globalCharFrequencies?: {
    zhihu: CharFrequency
    sc: CharFrequency
    tc: CharFrequency
    guji: CharFrequency
    combined: CharFrequency
  } | null
}

const props = defineProps<Props>()

// 轉換 CodeTable 到 RawCodeTable
// 為了保持與 generateBaseTablesFromRaw 的兼容性，這裡使用基於字符Unicode值的穩定排序
function convertCodeTableToRaw(codeTable: CodeTable): RawCodeTable {
  const rawCodeTable = new Map<number, [string, string, number]>()
  
  // 創建字符-編碼對的數組，並按字符的Unicode值進行穩定排序
  const charCodePairs: Array<[string, string]> = []
  for (const [char, codes] of codeTable) {
    // CodeTable is Map<string, string[]>, so iterate over codes array
    for (const code of codes) {
      charCodePairs.push([char, code])
    }
  }
  
  // 按字符Unicode值排序，確保相同輸入總是產生相同順序
  charCodePairs.sort((a, b) => {
    const charCompare = a[0].localeCompare(b[0])
    if (charCompare !== 0) return charCompare
    return a[1].localeCompare(b[1]) // 同一字符的不同編碼按編碼排序
  })
  
  // 計算每個編碼下的 N 選位置
  const codePositionMap = new Map<string, Map<string, number>>()
  for (const [char, code] of charCodePairs) {
    if (!codePositionMap.has(code)) {
      codePositionMap.set(code, new Map())
    }
    const charMap = codePositionMap.get(code)!
    if (!charMap.has(char)) {
      charMap.set(char, charMap.size + 1)
    }
  }
  
  // 分配行號和 position
  charCodePairs.forEach(([char, code], index) => {
    const position = codePositionMap.get(code)!.get(char)!
    rawCodeTable.set(index, [char, code, position])
  })
  
  return rawCodeTable
}

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 定義方案數據接口
interface DynamicData {
  dynamicDupRate: number
  dynamicDupRateSC: number
  dynamicDupRateTC: number
  dynamicDupRateGuji: number
  dynamicDupRateUnified: number
}

interface StaticData {
  gb2312DuplicateChars: number
  tongguiDuplicateChars: number
  guoziDuplicateChars: number
  cjkBasicDuplicateChars: number
  cjkToADuplicateChars: number
  cjkToBDuplicateChars: number
  cjkToFDuplicateChars: number
  cjkToJDuplicateChars: number
}

interface SpeedEquivData {
  zhihuEquiv: number
  scEquiv: number
  tcEquiv: number
  gujiEquiv: number
  unifiedEquiv: number
}

interface MaxCandidatesData {
  gb2312MaxCount: number
  guoziMaxCount: number
  cjkBasicMaxCount: number
  cjkToAMaxCount: number
  cjkToBMaxCount: number
  cjkToFMaxCount: number
  cjkToJMaxCount: number
}

interface SchemeData {
  dynamic?: DynamicData
  dynamicOriginal?: DynamicData
  static?: StaticData
  maxCandidates?: MaxCandidatesData
  speedEquiv?: SpeedEquivData
}

// 定義方案接口
interface Scheme {
  id: string
  name: string
  rawCodeTable?: RawCodeTable  // 原始碼表數據
  isBuiltin: boolean
  isCalculating: boolean
  isPrefix: boolean
  prefixKeys?: string[]  // 前綴碼上屏鍵
  data?: SchemeData
  // 元數據字段
  source?: string // 來源（文件名或預設方案ID）
  uploadedAt?: Date // 上傳時間
  // 處理後的碼表數據（四個輔助表）
  processedTables?: ProcessedCodeTables
  // 額外的元數據
  allUniqueChars?: Set<string>                 // 所有唯一字符
  charsetMap?: Map<CharsetType, Set<string>>   // 字符集映射
  maxLength?: number                           // 最大碼長
  // 收字數（碼表中漢字總數）
  charCount?: number
}

// 定義預設方案接口
interface BuiltinScheme {
  id: string
  name: string
}

// 響應式數據
const yuhaoDefaultScheme = ref<Scheme | null>(null) // 宇浩日月方案
// 基本狀態管理
const cardRef = ref<HTMLElement>()
const currentUserScheme = ref<Scheme | null>(null) // 當前用户方案
const additionalSchemes = ref<Scheme[]>([]) // 額外添加的方案
const showAddForm = ref(false)
const selectedBuiltinSchemes = ref<string[]>([]) // 多選預設方案
const selectedBuiltinScheme = ref('') // 保留單選邏輯用於兼容性
const isAdding = ref(false)
const uploadProgress = ref({ current: 0, total: 0 }) // 上傳進度
const availableBuiltinSchemes = ref<BuiltinScheme[]>([])
const fileInputCharCode = ref<HTMLInputElement>()
const fileInputCodeChar = ref<HTMLInputElement>()
const uploadPrefixFlag = ref(false) // 用戶上傳文件時的前綴碼標誌

// Tooltip 狀態管理
const tooltip = ref({
  show: false,
  text: '',
  x: 0,
  y: 0
})

// Tab 相關狀態
const activeTab = ref<'dynamic' | 'dynamicOriginal' | 'static' | 'maxCandidates' | 'speedEquiv'>('dynamic')
const tabs = [
  { key: 'dynamic', label: '動態選重' },
  { key: 'dynamicOriginal', label: '原始動態選重' },
  { key: 'static', label: '靜態重碼' },
  { key: 'maxCandidates', label: '最大候選' },
  { key: 'speedEquiv', label: '速度當量' }
] as const

// 排序相關狀態
type SortDirection = 'desc' | 'asc' | 'none'
type DataSortColumn = 'dynamicDupRate' | 'dynamicDupRateSC' | 'dynamicDupRateTC' | 'dynamicDupRateGuji' | 'dynamicDupRateUnified' | 
                      'gb2312DuplicateChars' | 'tongguiDuplicateChars' | 'guoziDuplicateChars' | 'cjkBasicDuplicateChars' | 
                      'cjkToBDuplicateChars' | 'cjkToJDuplicateChars' |
                      'gb2312MaxCount' | 'guoziMaxCount' | 'cjkBasicMaxCount' | 
                      'cjkToBMaxCount' | 'cjkToJMaxCount' |
                      'zhihuEquiv' | 'scEquiv' | 'tcEquiv' | 'gujiEquiv' | 'unifiedEquiv'
type SortColumn = 'name' | 'charCount' | DataSortColumn

const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<SortDirection>('none')

// 創建服務實例
const builtinService = new BuiltinCodeTableService()

// 本地存儲鍵名
const COMPARISON_STORAGE_KEY = 'yuhao-comparison-schemes'

// 保存方案數據到本地存儲
const saveComparisonData = () => {
  try {
    const dataToSave = {
      additionalSchemes: additionalSchemes.value.map(scheme => ({
        id: scheme.id,
        name: scheme.name,
        isBuiltin: scheme.isBuiltin,
        isPrefix: scheme.isPrefix, // 保存前綴碼設置
        prefixKeys: scheme.prefixKeys, // 保存前綴碼上屏键
        data: scheme.data,
        charCount: scheme.charCount, // 保存收字數
        codeTableSize: scheme.rawCodeTable?.size || 0,
        // 保存預設方案的 key 用於重新載入
        builtinKey: scheme.isBuiltin ? scheme.id.split('_')[1] : undefined,
        // 對於非預設方案，我們不保存 codeTable（太大了），
        // 而是保存一個標記表明這是上傳方案，需要重新上傳
        isUploadedScheme: !scheme.isBuiltin,
        // 保存新增的元數據
        source: scheme.source,
        uploadedAt: scheme.uploadedAt
      }))
    }
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    console.error('保存對比數據失敗:', error)
  }
}

// 從本地存儲載入方案數據
const loadComparisonData = async () => {
  try {
    const savedData = localStorage.getItem(COMPARISON_STORAGE_KEY)
    if (!savedData) return

    const data = JSON.parse(savedData)
    
    // 恢復額外方案
    if (data.additionalSchemes && Array.isArray(data.additionalSchemes)) {
      for (const savedScheme of data.additionalSchemes) {
        try {
          let rawCodeTable: RawCodeTable | undefined
          let correctIsPrefix = savedScheme.isPrefix || false // 默認從保存的數據中獲取
          
          if (savedScheme.isBuiltin && savedScheme.builtinKey) {
            // 重新載入預設方案
            const result = await builtinService.downloadRawCodeTable(savedScheme.builtinKey)
            rawCodeTable = result.rawCodeTable
            
            // 重新獲取預設方案的正確前綴碼設置
            const schemeConfig = await builtinService.getBuiltinCodeTable(savedScheme.builtinKey)
            correctIsPrefix = schemeConfig?.isPrefix || false
            console.log(`[調試] 恢復預設方案 ${savedScheme.name}:`, {
              builtinKey: savedScheme.builtinKey,
              savedIsPrefix: savedScheme.isPrefix,
              configPrefix: schemeConfig?.isPrefix,
              finalIsPrefix: correctIsPrefix
            })
          } else if (savedScheme.isUploadedScheme) {
            // 上傳方案：rawCodeTable 没有被保存，需要重新上傳
            rawCodeTable = undefined
            console.log(`恢復上傳方案 ${savedScheme.name}: 需要重新上傳碼表文件`, {
              savedIsPrefix: savedScheme.isPrefix,
              finalIsPrefix: correctIsPrefix
            })
          } else {
            console.log(`恢復方案 ${savedScheme.name}:`, {
              savedIsPrefix: savedScheme.isPrefix,
              finalIsPrefix: correctIsPrefix
            })
          }
          
          // 創建恢復的方案對象
          const restoredScheme: Scheme = {
            id: savedScheme.id,
            name: savedScheme.name,
            isBuiltin: savedScheme.isBuiltin,
            isCalculating: false,
            isPrefix: correctIsPrefix, // 使用正確的前綴碼設置
            prefixKeys: savedScheme.prefixKeys, // 恢復前綴碼上屏键
            data: savedScheme.data,
            charCount: savedScheme.charCount, // 恢復收字數
            rawCodeTable: rawCodeTable || new Map(),
            source: savedScheme.source,
            uploadedAt: savedScheme.uploadedAt ? new Date(savedScheme.uploadedAt) : undefined
          }
          
          // 如果沒有保存的charCount或rawCodeTable，異步計算
          if ((!savedScheme.charCount || !rawCodeTable) && savedScheme.isBuiltin && savedScheme.builtinKey) {
            // 對於預設方案，如果缺少charCount，後續重新計算
            setTimeout(async () => {
              if (restoredScheme.rawCodeTable && !restoredScheme.charCount) {
                try {
                  restoredScheme.charCount = await calculateCharCountFromRaw(restoredScheme.rawCodeTable)
                  saveComparisonData() // 保存更新後的數據
                } catch (error) {
                  console.error(`計算方案 ${restoredScheme.name} 收字數失敗:`, error)
                }
              }
            }, 100)
          }
          
          additionalSchemes.value.push(restoredScheme)
        } catch (error) {
          console.error(`恢復方案 ${savedScheme.name} 失敗:`, error)
        }
      }
      
      // 數據加載完成後，為缺少數據的方案啟動智能計算
      nextTick(() => {
        const schemesNeedingCalculation = additionalSchemes.value.filter(scheme => 
          scheme.rawCodeTable && !scheme.isCalculating && (!scheme.data || Object.keys(scheme.data).length < 4)
        )
        
        if (schemesNeedingCalculation.length > 0) {

          ensureCurrentTabDataLoaded()
        }
      })
    }
  } catch (error) {
    console.error('載入對比數據失敗:', error)
  }
}

// 檢查是否需要顯示主方案恢復提示
// 檢查主方案恢復提示（已移至主方案選擇組件）
function checkMainSchemeRestoreHint() {
  // 主方案持久化現在由 CodeTableUploaderCard 處理
  // 此函數保留以避免調用錯誤，但不執行任何操作
}

// 清理本地存儲數據
const clearComparisonData = () => {
  localStorage.removeItem(COMPARISON_STORAGE_KEY)
}

// 計算屬性 - 合併所有方案用於顯示
const allSchemes = computed(() => {
  const schemes = []
  if (currentUserScheme.value) schemes.push(currentUserScheme.value)
  schemes.push(...additionalSchemes.value)
  
  // 如果没有排序，直接返回
  if (!sortColumn.value || sortDirection.value === 'none') {
    return schemes
  }
  
  // 進行排序
  return [...schemes].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    if (sortColumn.value === 'name') {
      aValue = a.name
      bValue = b.name
    } else if (sortColumn.value === 'charCount') {
      aValue = a.charCount ?? 0
      bValue = b.charCount ?? 0
    } else if (sortColumn.value) {
      // TypeScript類型保護：確保sortColumn.value是數據列而不是'name'
      const column = sortColumn.value as DataSortColumn
      
      // 根據列名判斷是動態還是靜態數據
      if (['dynamicDupRate', 'dynamicDupRateSC', 'dynamicDupRateTC', 'dynamicDupRateGuji', 'dynamicDupRateUnified'].includes(column)) {
        // 根據當前 Tab 選擇正確的數據源
        if (activeTab.value === 'dynamicOriginal') {
          aValue = a.data?.dynamicOriginal?.[column as keyof DynamicData] ?? 0
          bValue = b.data?.dynamicOriginal?.[column as keyof DynamicData] ?? 0
        } else {
          aValue = a.data?.dynamic?.[column as keyof DynamicData] ?? 0
          bValue = b.data?.dynamic?.[column as keyof DynamicData] ?? 0
        }
      } else if (['gb2312MaxCount', 'guoziMaxCount', 'cjkBasicMaxCount', 'cjkToBMaxCount', 'cjkToJMaxCount'].includes(column)) {
        aValue = a.data?.maxCandidates?.[column as keyof MaxCandidatesData] ?? 0
        bValue = b.data?.maxCandidates?.[column as keyof MaxCandidatesData] ?? 0
      } else if (['zhihuEquiv', 'scEquiv', 'tcEquiv', 'gujiEquiv', 'unifiedEquiv'].includes(column)) {
        aValue = a.data?.speedEquiv?.[column as keyof SpeedEquivData] ?? 0
        bValue = b.data?.speedEquiv?.[column as keyof SpeedEquivData] ?? 0
      } else {
        aValue = a.data?.static?.[column as keyof StaticData] ?? 0
        bValue = b.data?.static?.[column as keyof StaticData] ?? 0
      }
    } else {
      aValue = 0
      bValue = 0
    }
    
    // 字符串排序
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortDirection.value === 'asc' ? comparison : -comparison
    }
    
    // 數值排序
    const comparison = aValue - bValue
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// 計算屬性 - 過濾掉收字爲0的方案用於表格顯示
const visibleSchemes = computed(() => {
  return allSchemes.value.filter(scheme => {
    // 正在計算中的方案始終顯示
    if (scheme.isCalculating) return true
    
    // 收字數量存在且大於0的方案顯示
    if (scheme.charCount && scheme.charCount > 0) return true
    
    // 收字數量爲undefined或null的方案也顯示（可能還未計算完成）
    if (scheme.charCount === undefined || scheme.charCount === null) return true
    
    // 只隱藏確實收字爲0的方案
    return false
  })
})

// 計算屬性 - 被隱藏的方案數量
const hiddenSchemesCount = computed(() => {
  return allSchemes.value.filter(scheme => 
    !scheme.isCalculating && 
    scheme.charCount !== undefined && 
    scheme.charCount !== null && 
    scheme.charCount === 0
  ).length
})

// 計算屬性 - 是否有任何方案
const hasAnyScheme = computed(() => allSchemes.value.length > 0)

// 智能計算隊列管理
type TabType = 'dynamic' | 'dynamicOriginal' | 'static' | 'maxCandidates' | 'speedEquiv'

interface CalculationTask {
  id: string
  schemeId: string
  tabType: TabType
  priority: 'high' | 'low'
  abortController: AbortController
  promise: Promise<void>
}

const calculationQueue = ref<CalculationTask[]>([])
const runningTasks = ref(new Set<string>())

// 計算進度追蹤
const backgroundProgress = computed(() => {
  const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
  
  // 1. 當前表格中的方案數量（包括已完成和正在計算的）
  const currentSchemes = allSchemes.value.length
  
  // 2. 如果正在上傳文件，使用上傳進度來計算待處理的方案數
  let pendingUploadCount = 0
  if (isAdding.value && uploadProgress.value.total > 0) {
    // 剩餘待上傳的文件數 = 總文件數 - 已處理文件數
    pendingUploadCount = uploadProgress.value.total - uploadProgress.value.current
  } else if (isAdding.value) {
    // 如果是添加預設方案，使用 selectedBuiltinSchemes
    pendingUploadCount = selectedBuiltinSchemes.value.length
  }
  
  // 3. 目標總方案數 = 當前方案數 + 待上傳方案數
  const targetTotalSchemes = currentSchemes + pendingUploadCount
  
  if (targetTotalSchemes === 0) return { completed: 0, total: 0, percentage: 100 }
  
  // 4. 目標總任務數 = 目標總方案數 × 4個標籤頁
  const targetTotalTasks = targetTotalSchemes * allTabs.length
  
  // 5. 統計已完成的任務數（只計算已完成且不在計算中的）
  let completedTasks = 0
  for (const scheme of allSchemes.value) {
    if (!scheme.isCalculating) {
      if (scheme.data?.dynamic) completedTasks++
      if (scheme.data?.static) completedTasks++
      if (scheme.data?.maxCandidates) completedTasks++
      if (scheme.data?.speedEquiv) completedTasks++
    }
  }
  
  // 6. 判斷是否有正在進行的任務或還有未完成的任務
  const hasRunning = runningTasks.value.size > 0 || 
                    allSchemes.value.some(s => s.isCalculating) || 
                    isAdding.value
  
  // 7. 檢查每個方案是否所有4個tab都已完成
  let allSchemesCompleted = true
  for (const scheme of allSchemes.value) {
    if (!scheme.data?.dynamic || !scheme.data?.static || 
        !scheme.data?.maxCandidates || !scheme.data?.speedEquiv) {
      allSchemesCompleted = false
      break
    }
  }
  
  // 8. 如果還有方案未上傳或有方案的tab未完成，就應該顯示進度
  const shouldShowProgress = hasRunning || !allSchemesCompleted || pendingUploadCount > 0
  
  const percentage = shouldShowProgress ? Math.round((completedTasks / targetTotalTasks) * 100) : 100
  
  // 控制台輸出調試信息
  console.log('[進度條調試]', {
    pendingUploadCount,
    currentSchemes,
    targetTotalSchemes,
    targetTotalTasks,
    completedTasks,
    percentage,
    hasRunning,
    shouldShowProgress,
    allSchemesCompleted,
    isAdding: isAdding.value,
    runningTasksSize: runningTasks.value.size,
    calculatingSchemes: allSchemes.value.filter(s => s.isCalculating).length,
    // 额外调试信息
    selectedBuiltinSchemesLength: selectedBuiltinSchemes.value.length,
    selectedBuiltinSchemes: selectedBuiltinSchemes.value,
    uploadProgress: uploadProgress.value,
    allSchemesNames: allSchemes.value.map(s => s.name),
    schemesCompletion: allSchemes.value.map(s => ({
      name: s.name,
      dynamic: !!s.data?.dynamic,
      static: !!s.data?.static,
      maxCandidates: !!s.data?.maxCandidates,
      speedEquiv: !!s.data?.speedEquiv
    }))
  })
  
  return {
    completed: completedTasks,
    total: targetTotalTasks,
    percentage: Math.max(0, Math.min(100, percentage)), // 確保在0-100範圍内
    hasRunning: shouldShowProgress,
    // 調試信息
    debug: {
      currentSchemes,
      pendingUploadCount,
      targetTotalSchemes,
      completedTasks,
      targetTotalTasks,
      hasRunning
    }
  }
})

// 是否有後台任務在運行
const hasBackgroundTasks = computed(() => {
  const hasCalculationTasks = runningTasks.value.size > 0
  const hasUploadTasks = isAdding.value
  const hasCalculatingSchemes = allSchemes.value.some(s => s.isCalculating)
  
  return hasCalculationTasks || hasUploadTasks || hasCalculatingSchemes
})

// 進度文本
const progressText = computed(() => {
  const pendingUploadCount = isAdding.value ? selectedBuiltinSchemes.value.length : 0
  const calculatingCount = allSchemes.value.filter(s => s.isCalculating).length
  const backgroundTaskCount = runningTasks.value.size
  
  if (pendingUploadCount > 0) {
    return pendingUploadCount > 1 ? 
      `添加方案中 (待處理${pendingUploadCount}個)` : 
      '添加方案中'
  }
  
  if (calculatingCount > 0) {
    return calculatingCount > 1 ?
      `處理方案中 (${calculatingCount}個加載中)` :
      '處理方案中'
  }
  
  if (backgroundTaskCount > 0) {
    return '後台預計算中'
  }
  
  return '處理中'
})

// 清理已完成或被取消的任務
const cleanupQueue = () => {
  calculationQueue.value = calculationQueue.value.filter(task => 
    runningTasks.value.has(task.id)
  )
}

// 取消低優先級任務
const cancelLowPriorityTasks = () => {
  for (const task of calculationQueue.value) {
    if (task.priority === 'low') {
      task.abortController.abort()
      runningTasks.value.delete(task.id)
    }
  }
  cleanupQueue()
}

// 智能計算調度器
const scheduleCalculation = async (scheme: Scheme, tabType: TabType, priority: 'high' | 'low' = 'low') => {
  const taskId = `${scheme.id}-${tabType}`
  
  // 檢查是否已經有相同的任務在運行
  if (runningTasks.value.has(taskId)) {
    return
  }
  
  // 檢查數據是否已存在
  const hasData = (
    (tabType === 'dynamic' && scheme.data?.dynamic) ||
    (tabType === 'dynamicOriginal' && scheme.data?.dynamicOriginal) ||
    (tabType === 'static' && scheme.data?.static) ||
    (tabType === 'maxCandidates' && scheme.data?.maxCandidates) ||
    (tabType === 'speedEquiv' && scheme.data?.speedEquiv)
  )
  
  if (hasData) {
    return
  }
  
  // 如果是高優先級任務，取消所有低優先級任務
  if (priority === 'high') {
    cancelLowPriorityTasks()
  }
  
  const abortController = new AbortController()
  runningTasks.value.add(taskId)
  
  const calculateTask = async () => {
    try {
      if (!scheme.rawCodeTable) {
        console.warn(`方案 ${scheme.name} 缺少 codeTable，跳過計算`)
        return
      }
      
      // 檢查是否被取消
      if (abortController.signal.aborted) {
        return
      }
      
      // 設置計算狀態（只有高優先級任務才顯示loading）
      if (priority === 'high') {
        scheme.isCalculating = true
      }
      
      console.log(`[智能計算] 開始計算 ${scheme.name} - ${tabType} (${priority} 優先級)`)
      
      // 確保有預處理數據（使用完整預處理以支持速度當量計算）
      if (!scheme.processedTables && scheme.rawCodeTable) {
        const result = await preprocessCodeTableDataComplete(scheme.rawCodeTable, scheme.isPrefix, scheme.prefixKeys)
        scheme.processedTables = result.processedTables
        scheme.allUniqueChars = result.allUniqueChars
        scheme.charsetMap = result.charsetMap
        scheme.maxLength = result.maxLength
        if (!scheme.charCount) {
          scheme.charCount = await calculateCharCountFromRaw(scheme.rawCodeTable)
        }
      }
      
      // 確保有數據對象
      if (!scheme.data) {
        scheme.data = {}
      }
      
      // 再次檢查是否被取消
      if (abortController.signal.aborted) {
        return
      }
      
      // 執行具體計算
      if (tabType === 'dynamic') {
        scheme.data.dynamic = await calculateDynamicData(scheme)
      } else if (tabType === 'dynamicOriginal') {
        scheme.data.dynamicOriginal = await calculateDynamicOriginalData(scheme)
      } else if (tabType === 'static') {
        scheme.data.static = await calculateStaticData(scheme)
      } else if (tabType === 'maxCandidates') {
        scheme.data.maxCandidates = await calculateMaxCandidatesData(scheme)
      } else if (tabType === 'speedEquiv') {
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme)
      }
      
      console.log(`[智能計算] 完成計算 ${scheme.name} - ${tabType}`)
      
      // 保存數據
      saveComparisonData()
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error(`[智能計算] 計算失敗 ${scheme.name} - ${tabType}:`, error)
      }
    } finally {
      if (priority === 'high') {
        scheme.isCalculating = false
      }
      runningTasks.value.delete(taskId)
    }
  }
  
  const task: CalculationTask = {
    id: taskId,
    schemeId: scheme.id,
    tabType,
    priority,
    abortController,
    promise: calculateTask()
  }
  
  calculationQueue.value.push(task)
  return task.promise
}

// 確保當前 Tab 的數據已加載（高優先級）+ 預計算其他Tab（低優先級）
const ensureCurrentTabDataLoaded = async () => {
  const schemes = allSchemes.value.filter(s => s.rawCodeTable && !s.isCalculating)
  
  if (schemes.length === 0) return
  
  console.log(`[智能計算] 開始智能計算策略 - 當前Tab: ${activeTab.value}`)
  
  // 第一階段：立即計算當前Tab的所有數據（高優先級）
  const currentTabPromises = schemes.map(scheme => 
    scheduleCalculation(scheme, activeTab.value, 'high')
  )
  
  await Promise.all(currentTabPromises)
  console.log(`[智能計算] 當前Tab ${activeTab.value} 計算完成`)
  
  // 第二階段：後台預計算其他Tab的數據（低優先級）
  const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
  const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
  
  for (const tab of otherTabs) {
    // 爲每個其他Tab安排後台計算任務
    schemes.forEach(scheme => {
      scheduleCalculation(scheme, tab, 'low')
    })
  }
  
  console.log(`[智能計算] 已安排 ${otherTabs.length} 個Tab的後台預計算任務`)
}

// 爲方案計算缺失的數據
const calculateMissingData = async (scheme: Scheme) => {
  if (!scheme.rawCodeTable) {
    return
  }
  
  try {
    if (!scheme.data) {
      scheme.data = {}
    }
    
    // 如果没有預處理數據，先進行預處理（使用完整預處理以支持速度當量計算）
    if (!scheme.processedTables && scheme.rawCodeTable) {
      const result = await preprocessCodeTableDataComplete(scheme.rawCodeTable, scheme.isPrefix, scheme.prefixKeys)
      scheme.processedTables = result.processedTables
      scheme.allUniqueChars = result.allUniqueChars
      scheme.charsetMap = result.charsetMap
      scheme.maxLength = result.maxLength
      scheme.charCount = await calculateCharCountFromRaw(scheme.rawCodeTable!)
    }
    
    // 檢查是否爲主方案（不可刪除的方案）
    const isMainScheme = currentUserScheme.value && scheme.id === currentUserScheme.value.id
    
    if (activeTab.value === 'dynamic' && !scheme.data.dynamic) {
      scheme.data.dynamic = await calculateDynamicData(scheme)
    } else if (activeTab.value === 'static' && !scheme.data.static) {
      scheme.data.static = await calculateStaticData(scheme)
    } else if (activeTab.value === 'maxCandidates' && !scheme.data.maxCandidates) {
      scheme.data.maxCandidates = await calculateMaxCandidatesData(scheme)
    } else if (activeTab.value === 'speedEquiv' && !scheme.data.speedEquiv) {
      if (isMainScheme) {
        // 主方案使用全局已處理的碼表
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme)
      } else {
        // 新增方案使用優化計算
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme)
      }
    }
  } catch (error) {
    console.error(`計算方案 ${scheme.name} 的數據失敗:`, error)
  }
}

// 重新計算單個方案的數據
const recalculateScheme = async (scheme: Scheme) => {
  console.log(`[刷新按鈕] 開始重新計算方案: ${scheme.name}`, {
    hasCodeTable: !!scheme.rawCodeTable,
    codeTableSize: scheme.rawCodeTable?.size,
    isCalculating: scheme.isCalculating,
    isBuiltin: scheme.isBuiltin
  })
  
  if (scheme.isCalculating) {
    return
  }
  
  if (!scheme.rawCodeTable) {
    if (!scheme.isBuiltin) {
      // 對於上傳方案，提示用户重新上傳
      alert(`方案 "${scheme.name}" 的碼表數據已丢失（頁面刷新後上傳的文件會丢失）。\n\n請重新上傳該方案的碼表文件，或者移除該方案。`)
    } else {
      console.warn(`[刷新按鈕] 預設方案 ${scheme.name} 缺少 codeTable，這不應該發生`)
    }
    return
  }
  
  try {
    // 設置計算狀態
    scheme.isCalculating = true
    
    // 確保方案有預處理數據（使用完整預處理以支持速度當量計算）
    if (!scheme.processedTables && scheme.rawCodeTable) {
      console.log(`重新生成完整預處理數據 for ${scheme.name}`)
      const result = await preprocessCodeTableDataComplete(scheme.rawCodeTable, scheme.isPrefix, scheme.prefixKeys)
      scheme.processedTables = result.processedTables
      scheme.allUniqueChars = result.allUniqueChars
      scheme.charsetMap = result.charsetMap
      scheme.maxLength = result.maxLength
      if (!scheme.charCount) {
        scheme.charCount = await calculateCharCountFromRaw(scheme.rawCodeTable)
      }
    }
    
    // 確保方案有數據對象
    if (!scheme.data) {
      scheme.data = {}
    }
    
    console.log(`重新計算方案 ${scheme.name} (${activeTab.value})`)
    
    // 直接重新計算當前Tab的數據，不檢查是否存在
    if (activeTab.value === 'dynamic') {
      scheme.data.dynamic = await calculateDynamicData(scheme)
    } else if (activeTab.value === 'static') {
      scheme.data.static = await calculateStaticData(scheme)
    } else if (activeTab.value === 'maxCandidates') {
      scheme.data.maxCandidates = await calculateMaxCandidatesData(scheme)
    } else if (activeTab.value === 'speedEquiv') {
      // 檢查是否爲主方案（不可刪除的方案）
      const isMainScheme = currentUserScheme.value && scheme.id === currentUserScheme.value.id
      if (isMainScheme) {
        // 主方案使用全局已處理的碼表
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme)
      } else {
        // 新增方案使用優化計算
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme)
      }
    }
    
    // 保存數據
    saveComparisonData()
  } catch (error) {
    console.error(`重新計算方案 ${scheme.name} 失敗:`, error)
  } finally {
    scheme.isCalculating = false
  }
}

// 智能計算：監聽 Tab 切換
watch(activeTab, async (newTab) => {
  console.log(`[智能計算] Tab切換到: ${newTab}`)
  // 取消所有低優先級任務，重新安排計算
  cancelLowPriorityTasks()
  await ensureCurrentTabDataLoaded()
}, { immediate: true })

// 排序函數
const handleSort = (column: SortColumn) => {
  if (sortColumn.value === column) {
    // 循環切換排序方向：升序 -> 降序 -> 無排序 -> 升序
    switch (sortDirection.value) {
      case 'asc':
        sortDirection.value = 'desc'
        break
      case 'desc':
        sortDirection.value = 'none'
        sortColumn.value = null
        break
      case 'none':
        sortDirection.value = 'asc'
        break
    }
  } else {
    // 新列，從升序開始
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// 獲取排序箭頭
const getSortArrow = (column: SortColumn) => {
  if (sortColumn.value !== column || sortDirection.value === 'none') {
    return '⇅'
  }
  return sortDirection.value === 'desc' ? '↓' : '↑'
}

// 使用 CodeTableProcessingService 進行完整的預處理（生成四個輔助碼表）
async function preprocessCodeTableDataComplete(rawCodeTable: RawCodeTable, isPrefix = false, prefixKeys?: string[]): Promise<{
  processedTables: ProcessedCodeTables,
  allUniqueChars: Set<string>,
  charsetMap: Map<CharsetType, Set<string>>,
  maxLength: number
}> {
  const timerId = Math.random().toString(36).substr(2, 9)
  console.time(`完整碼表預處理-${timerId}`)
  
  // 使用 CodeTableProcessingService 的新流程，確保使用 generateBaseTablesFromRaw
  console.time(`生成所有輔助表-${timerId}`)
  const processedTables = await codeTableProcessingService.processRawCodeTable(
    rawCodeTable,
    {
      isPrefix,
      prefixKeys
    }
  )
  console.timeEnd(`生成所有輔助表-${timerId}`)
  
  console.log(`[preprocessCodeTableDataComplete] 處理完成，生成的辅助表大小:`, {
    fullSize: processedTables.full.size,
    shortSize: processedTables.short.size,
    fullWithSelectionSize: processedTables.fullWithSelection.size,
    shortWithSelectionSize: processedTables.shortWithSelection.size
  })
  
  // 計算最大碼長
  let maxLength = 0
  for (const [, codes] of processedTables.full.entries()) {
    for (const code of codes) {
      maxLength = Math.max(maxLength, code.length)
    }
  }
  
  // 從碼表鍵中提取所有單個字符
  console.time(`提取唯一字符-${timerId}`)
  const allUniqueChars = new Set<string>()
  for (const key of processedTables.full.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }
  console.timeEnd(`提取唯一字符-${timerId}`)
  
  // 並行生成字符集
  console.time(`生成字符集-${timerId}`)
  const charsetTypes: CharsetType[] = [
    'gb2312', 'tonggui', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_j'
  ]
  
  const charsetPromises = charsetTypes.map(async (type) => {
    const charset = await generateCharset(type, allUniqueChars)
    return { type, charset }
  })
  const charsetResults = await Promise.all(charsetPromises)
  
  const charsetMap = new Map<CharsetType, Set<string>>()
  charsetResults.forEach(({ type, charset }) => {
    charsetMap.set(type, charset)
  })
  console.timeEnd(`生成字符集-${timerId}`)
  
  console.timeEnd(`完整碼表預處理-${timerId}`)
  
  return {
    processedTables,
    allUniqueChars,
    charsetMap,
    maxLength
  }
}

// 計算字符集的重碼字符數
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable) {
  const actualCharset = await generateCharset(charsetType, allChars)
  
  const fullCodeToChars = new Map<string, string[]>()
  
  for (const char of actualCharset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
    }
  }
  
  return fullDuplicateChars
}

// 初始化預設方案列表
onMounted(async () => {
  try {
    const config = await builtinService.loadConfig()
    availableBuiltinSchemes.value = config.builtinCodeTables.map(table => ({
      id: table.key,
      name: table.name
    }))
    
    // 載入保存的對比數據
    await loadComparisonData()
    
    // 檢查是否需要顯示主方案恢復提示
    checkMainSchemeRestoreHint()
    
    // 如果用户有當前方案，也載入它
    if (props.currentCodeTable) {
      loadCurrentUserScheme()
    }
  } catch (error) {
    console.error('載入預設方案列表失敗:', error)
  }
})

// 組件卸載時清理緩存
onUnmounted(() => {
  // 取消所有運行中的計算任務
  for (const task of calculationQueue.value) {
    task.abortController.abort()
  }
  calculationQueue.value = []
  runningTasks.value.clear()
  
  clearCache()
})

// 監聽當前方案變化
watch(() => [props.currentCodeTable, props.currentCodeTableName], ([newCodeTable, newCodeTableName]) => {
  console.log('[ComparisonCard] 監聽器觸發:', {
    hasCodeTable: !!newCodeTable,
    codeTableSize: (newCodeTable as CodeTable)?.size,
    codeTableName: newCodeTableName
  })
  
  if (newCodeTable) {
    loadCurrentUserScheme()
  } else {
    currentUserScheme.value = null
  }
})

// 監聽方案數據變化並自動保存
watch([additionalSchemes, currentUserScheme], () => {
  // 延遲保存以避免頻繁寫入
  setTimeout(() => {
    saveComparisonData()
  }, 500)
}, { deep: true })

// 載入當前用户方案
const loadCurrentUserScheme = async () => {
  if (props.currentCodeTable) {
    const schemeName = props.currentCodeTableName || '用户方案'
    const processingOptions = codeTableProcessingService.getProcessingOptions()
    const globalIsPrefix = processingOptions?.isPrefix || false
    
    currentUserScheme.value = {
      id: `current-${Date.now()}`,
      name: schemeName,
      rawCodeTable: props.currentCodeTable ? convertCodeTableToRaw(props.currentCodeTable) : undefined,
      isBuiltin: false,
      isCalculating: true,
      isPrefix: globalIsPrefix,
      data: undefined
    }
    
    // 檢查全局緩存，如果不存在则重新生成
    let globalProcessedTables = codeTableProcessingService.getProcessedTables()
    
    if (!globalProcessedTables) {
      const rawCodeTable = convertCodeTableToRaw(props.currentCodeTable)
      await codeTableProcessingService.processRawCodeTable(
        rawCodeTable,
        {
          isPrefix: globalIsPrefix,
          prefixKeys: props.globalPrefixKeys
        }
      )
      globalProcessedTables = codeTableProcessingService.getProcessedTables()
    }
    
    if (globalProcessedTables) {
      currentUserScheme.value.processedTables = globalProcessedTables
      
      // 从全局處理结果中提取必要数据
      const allUniqueChars = new Set<string>()
      for (const key of globalProcessedTables.full.keys()) {
        for (const char of key) {
          allUniqueChars.add(char)
        }
      }
      currentUserScheme.value.allUniqueChars = allUniqueChars
      
      // 生成字符集映射
      const charsetTypes: CharsetType[] = [
        'gb2312', 'tonggui', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_j'
      ]
      
      const charsetResults = await Promise.all(
        charsetTypes.map(async (type) => {
          const charset = await generateCharset(type, allUniqueChars)
          return { type, charset }
        })
      )
      
      const charsetMap = new Map<CharsetType, Set<string>>()
      charsetResults.forEach(({ type, charset }) => {
        charsetMap.set(type, charset)
      })
      currentUserScheme.value.charsetMap = charsetMap
      
      // 計算最大码长
      let maxLength = 0
      for (const [, codes] of globalProcessedTables.full.entries()) {
        for (const code of codes) {
          maxLength = Math.max(maxLength, code.length)
        }
      }
      currentUserScheme.value.maxLength = maxLength
      currentUserScheme.value.charCount = await calculateCharCountFromRaw(convertCodeTableToRaw(props.currentCodeTable!))
    }
    
    // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
    if (currentUserScheme.value) {
      currentUserScheme.value.data = {}
      
      // 高優先級：立即計算當前Tab數據
      await scheduleCalculation(currentUserScheme.value, activeTab.value, 'high')
      
      // 低優先級：安排其他Tab的後台計算
      const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
      const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
      for (const tab of otherTabs) {
        scheduleCalculation(currentUserScheme.value, tab, 'low')
      }
      
      currentUserScheme.value.isCalculating = false
    }
  }
}

// 辅助函数：从方案获取预處理表
function getProcessedTablesFromScheme(scheme: Scheme) {
  return scheme.processedTables
}

// 辅助函数：从方案获取完整碼表
function getFullCodeTableFromScheme(scheme: Scheme) {
  return scheme.processedTables?.full
}

// 計算靜態重碼數據（使用預處理的數據）- 高性能版本  
async function calculateStaticData(scheme: Scheme): Promise<StaticData> {
  console.time(`靜態重碼計算-${scheme.name}`)
  
  if (!getProcessedTablesFromScheme(scheme)) {
    throw new Error('方案缺少預處理數據')
  }
  
  const fullCodeTable = getFullCodeTableFromScheme(scheme)
  if (!fullCodeTable || !scheme.charsetMap) {
    throw new Error('方案缺少碼表數據')
  }
  const charsetMap = scheme.charsetMap
  
  // 使用高性能的批量重碼計算
  console.time(`計算各字符集重碼-${scheme.name}`)
  const results = calculateStaticDuplicates(fullCodeTable, charsetMap)
  console.timeEnd(`計算各字符集重碼-${scheme.name}`)
  
  console.timeEnd(`靜態重碼計算-${scheme.name}`)
  return {
    gb2312DuplicateChars: results.gb2312DuplicateChars || 0,
    tongguiDuplicateChars: results.tongguiDuplicateChars || 0,
    guoziDuplicateChars: results.guoziDuplicateChars || 0,
    cjkBasicDuplicateChars: results.cjk_basicDuplicateChars || 0,
    cjkToADuplicateChars: results.cjk_to_aDuplicateChars || 0,
    cjkToBDuplicateChars: results.cjk_to_bDuplicateChars || 0,
    cjkToFDuplicateChars: results.cjk_to_fDuplicateChars || 0,
    cjkToJDuplicateChars: results.cjk_to_jDuplicateChars || 0
  }
}

// 計算動態重碼數據（使用預處理的數據）- 高性能版本
async function calculateDynamicData(scheme: Scheme): Promise<DynamicData> {
  console.time(`動態重碼計算-${scheme.name}`)
  
  if (!scheme.processedTables) {
    throw new Error('方案缺少預處理數據')
  }
  
  if (!props.globalCharFrequencies) {
    throw new Error('全局字頻數據未加載')
  }
  
  const fullCodeTable = scheme.processedTables.full
  
  // 使用全局字頻數據
  const charFrequency = props.globalCharFrequencies.zhihu
  const charFrequencySC = props.globalCharFrequencies.sc
  const charFrequencyTC = props.globalCharFrequencies.tc
  const charFrequencyGuji = props.globalCharFrequencies.guji
  const charFrequencyUnified = props.globalCharFrequencies.combined
  
  // 計算各種動態選重率（只計算全碼）
  const dynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
  const dynamicDupRateSC = getDynamicDupRate(fullCodeTable, charFrequencySC)
  const dynamicDupRateTC = getDynamicDupRate(fullCodeTable, charFrequencyTC)
  const dynamicDupRateGuji = getDynamicDupRate(fullCodeTable, charFrequencyGuji)
  const dynamicDupRateUnified = getDynamicDupRate(fullCodeTable, charFrequencyUnified)
  
  console.timeEnd(`動態重碼計算-${scheme.name}`)
  return {
    dynamicDupRate,
    dynamicDupRateSC,
    dynamicDupRateTC,
    dynamicDupRateGuji,
    dynamicDupRateUnified
  }
}

// 計算動態重碼數據 - 原始排序（使用預處理的數據）- 高性能版本
async function calculateDynamicOriginalData(scheme: Scheme): Promise<DynamicData> {
  console.time(`動態重碼計算-原始-${scheme.name}`)
  
  if (!scheme.processedTables) {
    throw new Error('方案缺少預處理數據')
  }
  
  if (!props.globalCharFrequencies) {
    throw new Error('全局字頻數據未加載')
  }
  
  const fullWithSelectionTable = scheme.processedTables.fullWithSelection
  
  // 使用全局字頻數據
  const charFrequency = props.globalCharFrequencies.zhihu
  const charFrequencySC = props.globalCharFrequencies.sc
  const charFrequencyTC = props.globalCharFrequencies.tc
  const charFrequencyGuji = props.globalCharFrequencies.guji
  const charFrequencyUnified = props.globalCharFrequencies.combined
  
  // 使用新函數計算各種動態選重率（從原始順序的帶選重鍵碼表）
  const dynamicDupRate = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequency)
  const dynamicDupRateSC = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencySC)
  const dynamicDupRateTC = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyTC)
  const dynamicDupRateGuji = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyGuji)
  const dynamicDupRateUnified = getDynamicDupRateFromOriginalOrder(fullWithSelectionTable, charFrequencyUnified)
  
  console.timeEnd(`動態重碼計算-原始-${scheme.name}`)
  return {
    dynamicDupRate,
    dynamicDupRateSC,
    dynamicDupRateTC,
    dynamicDupRateGuji,
    dynamicDupRateUnified
  }
}

// 計算速度當量數據（使用預處理的數據）- 高性能版本  
async function calculateSpeedEquivData(scheme: Scheme): Promise<SpeedEquivData> {
  console.time(`速度當量計算-${scheme.name}`)
  
  if (!scheme.processedTables) {
    throw new Error('方案缺少預處理數據')
  }
  
  try {
    const fullCodeTable = scheme.processedTables.full
    const fullWithSelectionTable = scheme.processedTables.fullWithSelection
    const maxLength = scheme.maxLength
    
    // 檢查是否有預處理的選重表
    let processedCodeTable: CodeTable
    if (fullWithSelectionTable && fullWithSelectionTable.size > 0) {
      // 使用預處理好的全碼加選重表
      console.log(`使用預處理的全碼加選重表 (${fullWithSelectionTable.size} 字符)`)
      processedCodeTable = fullWithSelectionTable
    } else {
      console.error(`[錯誤] 方案 ${scheme.name} 的預處理表 fullWithSelectionTable 為空或未定義`)
      console.log(`[調試] 方案預處理數據:`, {
        processedTables: !!scheme.processedTables,
        fullTableSize: scheme.processedTables?.full?.size,
        fullWithSelectionSize: scheme.processedTables?.fullWithSelection?.size,
        shortTableSize: scheme.processedTables?.short?.size,
        shortWithSelectionSize: scheme.processedTables?.shortWithSelection?.size
      })
      throw new Error(`方案 ${scheme.name} 缺少預處理的選重表數據`)
    }
    
    if (!props.globalCharFrequencies) {
      throw new Error('全局字頻數據未加載')
    }
    
    // 加載當量表
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const equivTableData = await response.json()
    const equivTable = equivTableData.data || {}
    
    // 使用全局字頻數據
    const zhihuFreq = props.globalCharFrequencies.zhihu
    const scFreq = props.globalCharFrequencies.sc
    const tcFreq = props.globalCharFrequencies.tc
    const gujiFreq = props.globalCharFrequencies.guji
    const unifiedFreq = props.globalCharFrequencies.combined
    
    // 計算各種字頻下的速度當量
    const zhihuEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, zhihuFreq, equivTable)
    const scEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, scFreq, equivTable)
    const tcEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, tcFreq, equivTable)
    const gujiEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, gujiFreq, equivTable)
    const unifiedEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, unifiedFreq, equivTable)
    
    console.timeEnd(`速度當量計算-${scheme.name}`)
    return {
      zhihuEquiv,
      scEquiv,
      tcEquiv,
      gujiEquiv,
      unifiedEquiv
    }
  } catch (error) {
    console.error('速度當量計算失敗:', error)
    console.timeEnd(`速度當量計算-${scheme.name}`)
    return {
      zhihuEquiv: 0,
      scEquiv: 0,
      tcEquiv: 0,
      gujiEquiv: 0,
      unifiedEquiv: 0
    }
  }
}

// 計算最大候選項數據（使用預處理的數據）- 高性能版本
async function calculateMaxCandidatesData(scheme: Scheme): Promise<MaxCandidatesData> {
  try {
    console.time(`最大候選計算-${scheme.name}`)
    
    if (!scheme.processedTables) {
      throw new Error('方案缺少預處理數據')
    }

    const fullCodeTable = scheme.processedTables.full; const charsetMap = scheme.charsetMap
    
    // 使用高性能的批量計算，一次性處理所有字符集
    console.time(`計算各字符集最大候選-${scheme.name}`)
    const results = calculateAllMaxCandidates(fullCodeTable, charsetMap!)
    console.timeEnd(`計算各字符集最大候選-${scheme.name}`)
    
    console.timeEnd(`最大候選計算-${scheme.name}`)
    return {
      gb2312MaxCount: results.gb2312MaxCount || 0,
      guoziMaxCount: results.guoziMaxCount || 0,
      cjkBasicMaxCount: results.cjk_basicMaxCount || 0,
      cjkToAMaxCount: results.cjk_to_aMaxCount || 0,
      cjkToBMaxCount: results.cjk_to_bMaxCount || 0,
      cjkToFMaxCount: results.cjk_to_fMaxCount || 0,
      cjkToJMaxCount: results.cjk_to_jMaxCount || 0
    }
  } catch (error) {
    console.error('計算最大候選項數據失敗:', error)
    return {
      gb2312MaxCount: 0,
      guoziMaxCount: 0,
      cjkBasicMaxCount: 0,
      cjkToAMaxCount: 0,
      cjkToBMaxCount: 0,
      cjkToFMaxCount: 0,
      cjkToJMaxCount: 0
    }
  }
}

// ===== 调试导出函数 =====
async function exportSchemeDebugData(scheme: Scheme, schemeName: string, rawCodeTable: RawCodeTable) {
  try {
    console.log(`[导出调试] 开始导出 ${schemeName} 的数据`)
    
    // 1. 导出 RawCodeTable
    const rawData: Array<{lineIndex: number, char: string, code: string}> = []
    for (const [lineIndex, [char, code, ]] of rawCodeTable) {
      rawData.push({ lineIndex, char, code })
    }
    
    // 2. 导出 Full 全码碼表
    const fullData: Array<{char: string, codes: string[]}> = []
    if (scheme.processedTables?.full) {
      for (const [char, codes] of scheme.processedTables.full) {
        fullData.push({ char, codes })
      }
    }
    
    // 3. 创建导出数据
    const exportData = {
      schemeName,
      timestamp: new Date().toISOString(),
      rawCodeTable: {
        size: rawData.length,
        data: rawData
      },
      fullCodeTable: {
        size: fullData.length,
        data: fullData
      },
      metadata: {
        isPrefix: scheme.isPrefix,
        maxLength: scheme.maxLength,
        charCount: scheme.charCount,
        allUniqueCharsCount: scheme.allUniqueChars?.size
      }
    }
    
    // 4. 导出为JSON文件
    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `debug_${schemeName}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    console.log(`[导出调试] ${schemeName} 数据导出完成`)
    
    // 5. 同时导出为CSV格式的对比表
    await exportComparisonCSV(rawData, fullData, schemeName)
    
  } catch (error) {
    console.error(`[导出调试] 导出 ${schemeName} 数据失败:`, error)
  }
}

// 导出CSV对比表
async function exportComparisonCSV(rawData: Array<{lineIndex: number, char: string, code: string}>, fullData: Array<{char: string, codes: string[]}>, schemeName: string) {
  try {
    // 创建字符到全码的映射
    const charToFullCode = new Map<string, string[]>()
    fullData.forEach(item => {
      charToFullCode.set(item.char, item.codes)
    })
    
    // 创建CSV内容
    const csvLines = ['字符,原始編碼,行号,全碼表編碼,是否匹配']
    
    for (const rawItem of rawData.slice(0, 1000)) { // 限制前1000行避免文件过大
      const fullCodes = charToFullCode.get(rawItem.char) || []
      const fullCode = fullCodes[0] || ''
      const isMatch = fullCode === rawItem.code ? '是' : '否'
      
      csvLines.push(`${rawItem.char},${rawItem.code},${rawItem.lineIndex},"${fullCode}",${isMatch}`)
    }
    
    const csvContent = csvLines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `comparison_${schemeName}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`
    link.click()
    
    URL.revokeObjectURL(url)
    console.log(`[导出调试] ${schemeName} CSV对比表导出完成`)
    
  } catch (error) {
    console.error(`[导出调试] 导出 ${schemeName} CSV失败:`, error)
  }
}

// 已废弃：保留兼容性，但推荐使用分离的函数
// 這個函數將被移除，因爲現在使用預處理的架構
async function calculateSchemeData(codeTable: CodeTable, isPrefix = false): Promise<SchemeData> {
  // 創建臨時方案來使用新的計算邏輯
  const tempScheme: Scheme = {
    id: 'temp',
    name: 'temp',
    rawCodeTable: convertCodeTableToRaw(codeTable),
    isBuiltin: false,
    isCalculating: false,
    isPrefix
  }
  
  // 進行預處理（使用完整預處理以保持一致性）
  const result = await preprocessCodeTableDataComplete(convertCodeTableToRaw(codeTable), isPrefix, props.globalPrefixKeys)
  tempScheme.processedTables = result.processedTables
  tempScheme.allUniqueChars = result.allUniqueChars
  tempScheme.charsetMap = result.charsetMap
  tempScheme.maxLength = result.maxLength
  tempScheme.charCount = await calculateCharCountFromRaw(convertCodeTableToRaw(codeTable))
  
  const [dynamic, static_] = await Promise.all([
    calculateDynamicData(tempScheme),
    calculateStaticData(tempScheme)
  ])
  
  return {
    dynamic,
    static: static_
  }
}

// 選擇内置方案時自動添加
async function onBuiltinSchemeSelect() {
  if (selectedBuiltinScheme.value && !isAdding.value) {
    await addBuiltinScheme()
  }
}

// 添加預設方案
async function addBuiltinScheme() {
  if (!selectedBuiltinScheme.value || isAdding.value) return
  
  const builtinScheme = availableBuiltinSchemes.value.find(s => s.id === selectedBuiltinScheme.value)
  if (!builtinScheme) return

  isAdding.value = true
  
  try {
    // 獲取方案配置信息
    const schemeConfig = await builtinService.getBuiltinCodeTable(selectedBuiltinScheme.value)
    
    const newScheme: Scheme = {
      id: `builtin_${selectedBuiltinScheme.value}_${Date.now()}`,
      name: builtinScheme.name,
      isBuiltin: true,
      isCalculating: true,
      isPrefix: schemeConfig?.isPrefix || false,  // 從配置中獲取前綴碼屬性
      prefixKeys: schemeConfig?.prefixKeys, // 從配置中獲取前綴碼上屏键
      source: selectedBuiltinScheme.value, // 記録預設方案ID
      uploadedAt: new Date() // 添加時間
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 載入碼表並預處理數據
    const result = await builtinService.downloadRawCodeTable(selectedBuiltinScheme.value)
    newScheme.rawCodeTable = result.rawCodeTable
    
    // 預處理碼表數據（内置方案使用完整預處理以支持所有計算）
    const processedResult = await preprocessCodeTableDataComplete(result.rawCodeTable, newScheme.isPrefix, props.globalPrefixKeys)
    newScheme.processedTables = processedResult.processedTables
    newScheme.allUniqueChars = processedResult.allUniqueChars
    newScheme.charsetMap = processedResult.charsetMap
    newScheme.maxLength = processedResult.maxLength
    newScheme.charCount = await calculateCharCountFromRaw(result.rawCodeTable)
    
    // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
    newScheme.data = {}
    
    // 高優先級：立即計算當前Tab數據
    await scheduleCalculation(newScheme, activeTab.value, 'high')
    
    // 低優先級：安排其他Tab的後台計算
    const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
    const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
    for (const tab of otherTabs) {
      scheduleCalculation(newScheme, tab, 'low')
    }
    
    newScheme.isCalculating = false
    
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('添加預設方案失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
}

// 添加所有預設方案
async function addAllBuiltinSchemes() {
  if (isAdding.value || availableBuiltinSchemes.value.length === 0) return
  
  isAdding.value = true
  
  try {
    // 獲取已添加的預設方案ID，避免重複添加
    const existingBuiltinIds = new Set(
      additionalSchemes.value
        .filter(scheme => scheme.isBuiltin)
        .map(scheme => scheme.id.split('_')[1])
    )
    
    // 過濾出尚未添加的方案
    const schemesToAdd = availableBuiltinSchemes.value.filter(
      scheme => !existingBuiltinIds.has(scheme.id)
    )
    
    if (schemesToAdd.length === 0) {
      console.log('所有預設方案都已添加')
      return
    }
    
    // 逐個添加方案
    for (const builtinScheme of schemesToAdd) {
      try {
        // 獲取方案配置信息
        const schemeConfig = await builtinService.getBuiltinCodeTable(builtinScheme.id)
        
        const newScheme: Scheme = {
          id: `builtin_${builtinScheme.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: builtinScheme.name,
          isBuiltin: true,
          isCalculating: true,
          isPrefix: schemeConfig?.isPrefix || false,  // 從配置中獲取前綴碼屬性
          prefixKeys: schemeConfig?.prefixKeys, // 從配置中獲取前綴碼上屏键
          source: builtinScheme.id, // 記録預設方案ID
          uploadedAt: new Date() // 添加時間
        }
        
        additionalSchemes.value.push(newScheme)
        
        // 載入碼表並預處理數據
        const result = await builtinService.downloadRawCodeTable(builtinScheme.id)
        newScheme.rawCodeTable = result.rawCodeTable
        
        // 預處理碼表數據（只做一次）
        const processedResultX = await preprocessCodeTableDataComplete(result.rawCodeTable, newScheme.isPrefix, props.globalPrefixKeys)
        newScheme.processedTables = processedResultX.processedTables
        newScheme.allUniqueChars = processedResultX.allUniqueChars
        newScheme.charsetMap = processedResultX.charsetMap
        newScheme.maxLength = processedResultX.maxLength
        newScheme.charCount = await calculateCharCountFromRaw(result.rawCodeTable)
        
        // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
        newScheme.data = {}
        
        // 高優先級：立即計算當前Tab數據
        await scheduleCalculation(newScheme, activeTab.value, 'high')
        
        // 低優先級：安排其他Tab的後台計算
        const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
        const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
        for (const tab of otherTabs) {
          scheduleCalculation(newScheme, tab, 'low')
        }
        
        newScheme.isCalculating = false
        
      } catch (error) {
        console.error(`添加方案 ${builtinScheme.name} 失敗:`, error)
        // 移除失敗的方案
        const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
        if (index !== -1) {
          additionalSchemes.value.splice(index, 1)
        }
      }
    }
    
    showAddForm.value = false
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('批量添加預設方案失敗:', error)
  } finally {
    isAdding.value = false
  }
}

// 多選相關函數
function selectAllBuiltinSchemes() {
  selectedBuiltinSchemes.value = availableBuiltinSchemes.value.map(scheme => scheme.id)
}

function clearSelectedBuiltinSchemes() {
  selectedBuiltinSchemes.value = []
}

// 添加選中的預設方案
async function addSelectedBuiltinSchemes() {
  console.log('[内置方案] 开始添加选中的内置方案:', selectedBuiltinSchemes.value)
  
  if (isAdding.value || selectedBuiltinSchemes.value.length === 0) {
    console.log('[内置方案] 取消添加 - isAdding:', isAdding.value, 'selectedCount:', selectedBuiltinSchemes.value.length)
    return
  }
  
  isAdding.value = true
  
  try {
    // 獲取已添加的預設方案ID，避免重複添加
    const existingBuiltinIds = new Set(
      additionalSchemes.value
        .filter(scheme => scheme.isBuiltin)
        .map(scheme => scheme.id.split('_')[1])
    )
    
    // 過濾出尚未添加的方案
    const schemesToAdd = availableBuiltinSchemes.value.filter(
      scheme => selectedBuiltinSchemes.value.includes(scheme.id) && !existingBuiltinIds.has(scheme.id)
    )
    
    if (schemesToAdd.length === 0) {
      console.log('[内置方案] 选中的方案都已添加或无有效选择')
      console.log('[内置方案] 调试信息:', {
        selectedBuiltinSchemes: selectedBuiltinSchemes.value,
        availableBuiltinSchemes: availableBuiltinSchemes.value.map(s => ({id: s.id, name: s.name})),
        existingBuiltinIds: Array.from(existingBuiltinIds)
      })
      return
    }
    
    console.log('[内置方案] 准备添加的方案:', schemesToAdd.map(s => ({id: s.id, name: s.name})))
    
    // 逐個添加方案
    for (const builtinScheme of schemesToAdd) {
      try {
        const schemeConfig = await builtinService.getBuiltinCodeTable(builtinScheme.id)
        
        const newScheme: Scheme = {
          id: `builtin_${builtinScheme.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: builtinScheme.name,
          isBuiltin: true,
          isCalculating: true,
          isPrefix: schemeConfig?.isPrefix || false,  // 從配置中獲取前綴碼屬性
          prefixKeys: schemeConfig?.prefixKeys, // 從配置中獲取前綴碼上屏键
          source: builtinScheme.id, // 記録預設方案ID
          uploadedAt: new Date() // 添加時間
        }
        
        additionalSchemes.value.push(newScheme)
        
        // 下载并解析碼表
        const response = await fetch(schemeConfig!.url)
        if (!response.ok) {
          throw new Error(`Failed to download code table: ${response.statusText}`)
        }
        const text = await response.text()
        
        const { rawCodeTable } = BuiltinCodeTableService.parseRawCodeTable(text, schemeConfig!.format)
        newScheme.rawCodeTable = rawCodeTable
        
        // 處理碼表数据
        const processedResult = await preprocessCodeTableDataComplete(
          rawCodeTable, 
          newScheme.isPrefix, 
          props.globalPrefixKeys
        )
        newScheme.processedTables = processedResult.processedTables
        newScheme.allUniqueChars = processedResult.allUniqueChars
        newScheme.charsetMap = processedResult.charsetMap
        newScheme.maxLength = processedResult.maxLength
        newScheme.charCount = await calculateCharCountFromRaw(rawCodeTable)
        
        // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
        newScheme.data = {}
        
        // 高優先級：立即計算當前Tab數據
        await scheduleCalculation(newScheme, activeTab.value, 'high')
        
        // 低優先級：安排其他Tab的後台計算
        const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
        const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
        for (const tab of otherTabs) {
          scheduleCalculation(newScheme, tab, 'low')
        }
        
        newScheme.isCalculating = false
        
      } catch (error) {
        console.error(`添加方案 ${builtinScheme.name} 失敗:`, error)
        // 移除失敗的方案
        const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
        if (index !== -1) {
          additionalSchemes.value.splice(index, 1)
        }
      }
    }
    
    showAddForm.value = false
    selectedBuiltinSchemes.value = [] // 清空選擇
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('批量添加選中方案失敗:', error)
  } finally {
    isAdding.value = false
  }
}

// 觸發文件上傳
function triggerFileUpload(format: 'char_first' | 'code_first') {
  if (format === 'char_first') {
    fileInputCharCode.value?.click()
  } else {
    fileInputCodeChar.value?.click()
  }
}

// 處理文件上傳
async function handleFileUpload(event: Event, format: 'char_first' | 'code_first') {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || isAdding.value) return
  
  isAdding.value = true
  
  try {
    const newScheme: Scheme = {
      id: `upload_${Date.now()}`,
      name: file.name.replace(/\.(txt|csv)$/, ''),
      isBuiltin: false,
      isCalculating: true,
      isPrefix: uploadPrefixFlag.value,  // 使用上傳時的前綴碼設置
      prefixKeys: props.globalPrefixKeys, // 使用上傳時的前綴碼上屏键
      source: file.name, // 記録文件名
      uploadedAt: new Date() // 記録上傳時間
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 解析碼表文件，生成 RawCodeTable
    const text = await file.text()
    const { rawCodeTable } = BuiltinCodeTableService.parseRawCodeTable(text, format === 'char_first' ? 'char_first' : 'code_first')
    
    newScheme.rawCodeTable = rawCodeTable
    
    // 處理 RawCodeTable 生成四個輔助碼表
    const result = await preprocessCodeTableDataComplete(rawCodeTable, newScheme.isPrefix, props.globalPrefixKeys)
    newScheme.processedTables = result.processedTables
    newScheme.allUniqueChars = result.allUniqueChars
    newScheme.charsetMap = result.charsetMap
    newScheme.maxLength = result.maxLength
    newScheme.charCount = await calculateCharCountFromRaw(rawCodeTable)
    
    // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
    newScheme.data = {}
    
    // 高優先級：立即計算當前Tab數據
    await scheduleCalculation(newScheme, activeTab.value, 'high')
    
    // 低優先級：安排其他Tab的後台計算
    const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
    const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
    for (const tab of otherTabs) {
      scheduleCalculation(newScheme, tab, 'low')
    }
    
    newScheme.isCalculating = false
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('上傳碼表失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === file.name.replace(/\.(txt|csv)$/, '') && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
  
  // 清空文件輸入
  target.value = ''
}

// 處理多文件上傳
async function handleMultipleFileUpload(event: Event, format: 'char_first' | 'code_first') {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0 || isAdding.value) return
  
  isAdding.value = true
  uploadProgress.value = { current: 0, total: files.length }
  
  try {
    const fileList = Array.from(files)
    console.log(`準備上傳 ${fileList.length} 個文件`)
    
    // 逐個處理文件
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      uploadProgress.value.current = i + 1
      
      try {
        console.log(`正在處理文件 ${i + 1}/${fileList.length}: ${file.name}`)
        
        const newScheme: Scheme = {
          id: `upload_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.(txt|csv)$/, ''),
          isBuiltin: false,
          isCalculating: true,
          isPrefix: uploadPrefixFlag.value,  // 使用上傳時的前綴碼設置
          prefixKeys: props.globalPrefixKeys, // 使用上傳時的前綴碼上屏键
          source: file.name, // 記録文件名
          uploadedAt: new Date() // 記録上傳時間
        }
        
        additionalSchemes.value.push(newScheme)
        
        // 解析碼表文件 - 使用和主方案相同的解析函数
        const text = await file.text()
        const builtinService = new BuiltinCodeTableService()
        const { rawCodeTable } = BuiltinCodeTableService.parseRawCodeTable(text, format === 'char_first' ? 'char_first' : 'code_first')
        
        newScheme.rawCodeTable = rawCodeTable
        
        // 預處理碼表數據（只做一次）
        const result = await preprocessCodeTableDataComplete(rawCodeTable, newScheme.isPrefix, props.globalPrefixKeys)
        newScheme.processedTables = result.processedTables
        newScheme.allUniqueChars = result.allUniqueChars
        newScheme.charsetMap = result.charsetMap
        newScheme.maxLength = result.maxLength
        newScheme.charCount = await calculateCharCountFromRaw(rawCodeTable)
        
        // 使用智能計算策略：立即計算當前Tab，後台計算其他Tab
        newScheme.data = {}
        
        // 高優先級：立即計算當前Tab數據
        await scheduleCalculation(newScheme, activeTab.value, 'high')
        
        // 低優先級：安排其他Tab的後台計算
        const allTabs: TabType[] = ['dynamic', 'dynamicOriginal', 'static', 'maxCandidates', 'speedEquiv']
        const otherTabs = allTabs.filter(tab => tab !== activeTab.value)
        for (const tab of otherTabs) {
          scheduleCalculation(newScheme, tab, 'low')
        }
        
        newScheme.isCalculating = false
        
      } catch (error) {
        console.error(`處理文件 ${file.name} 失敗:`, error)
        // 移除失敗的方案
        const index = additionalSchemes.value.findIndex(s => s.name === file.name.replace(/\.(txt|csv)$/, '') && s.isCalculating)
        if (index !== -1) {
          additionalSchemes.value.splice(index, 1)
        }
      }
    }
    
    showAddForm.value = false
    selectedBuiltinSchemes.value = [] // 清空選擇
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
    console.log(`成功處理 ${fileList.length} 個文件`)
    
  } catch (error) {
    console.error('批量上傳碼表失敗:', error)
  } finally {
    isAdding.value = false
    uploadProgress.value = { current: 0, total: 0 }
  }
  
  // 清空文件輸入
  target.value = ''
}

// 輔助函数：將 CodeTable 轉換為 RawCodeTable（用於內建方案）
function codeTableToRawCodeTable(codeTable: CodeTable): RawCodeTable {
  const rawCodeTable = new Map<number, [string, string, number]>()
  
  // 创建字符-編碼对的数组
  const charCodePairs: Array<[string, string]> = []
  for (const [char, codes] of codeTable.entries()) {
    // CodeTable is Map<string, string[]>, so iterate over codes array
    for (const code of codes) {
      charCodePairs.push([char, code])
    }
  }
  
  // 排序以确保稳定性
  charCodePairs.sort((a, b) => {
    const charCompare = a[0].localeCompare(b[0])
    if (charCompare !== 0) return charCompare
    return a[1].localeCompare(b[1])
  })
  
  // 計算每個編碼下的 N 選位置
  const codePositionMap = new Map<string, Map<string, number>>()
  for (const [char, code] of charCodePairs) {
    if (!codePositionMap.has(code)) {
      codePositionMap.set(code, new Map())
    }
    const charMap = codePositionMap.get(code)!
    if (!charMap.has(char)) {
      charMap.set(char, charMap.size + 1)
    }
  }
  
  // 分配行號和 position
  charCodePairs.forEach(([char, code], index) => {
    const position = codePositionMap.get(code)!.get(char)!
    rawCodeTable.set(index, [char, code, position])
  })
  
  return rawCodeTable
}

// 解析碼表文本，生成 RawCodeTable
// 移除方案
// 判斷是否可以移除方案
function canRemoveScheme(scheme: Scheme): boolean {
  // 如果是當前用户方案，不能移除
  if (currentUserScheme.value && scheme.id === currentUserScheme.value.id) {
    return false
  }
  
  // 只有額外添加的方案才能移除
  return additionalSchemes.value.some(s => s.id === scheme.id)
}

// 導出功能
async function exportCard() {
  if (cardRef.value && hasAnyScheme.value) {
    const schemeNames = allSchemes.value.map(s => s.name).join('-')
    await ExportService.exportElementToPNG(cardRef.value, '方案對比', schemeNames, {
      copyToClipboard: ExportService.isClipboardSupported(),
    })
  }
}

// Tooltip 功能
function showTooltip(event: MouseEvent, scheme: Scheme) {
  const tooltipText = scheme.isBuiltin ? '預設方案' : scheme.rawCodeTable ? '上傳方案' : '數據快照'
  
  tooltip.value = {
    show: true,
    text: tooltipText,
    x: event.clientX + 10,
    y: event.clientY - 30
  }
}

function hideTooltip() {
  tooltip.value.show = false
}

// 移除方案
function removeScheme(scheme: Scheme) {
  if (!canRemoveScheme(scheme)) return
  
  // 在額外方案列表中查找並移除
  const additionalSchemeIndex = additionalSchemes.value.findIndex(s => s.id === scheme.id)
  
  if (additionalSchemeIndex !== -1) {
    additionalSchemes.value.splice(additionalSchemeIndex, 1)
    // 立即保存數據
    saveComparisonData()
  }
}

// 取消添加
function cancelAdd() {
  showAddForm.value = false
  selectedBuiltinScheme.value = ''
  selectedBuiltinSchemes.value = [] // 清空多選
}

// 重新上傳方案的碼表文件
function reuploadScheme(scheme: Scheme) {
  // 創建一個隱藏的文件輸入元素
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.txt,.json'
  fileInput.style.display = 'none'
  
  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    try {
      scheme.isCalculating = true
      
      // 解析碼表文件（使用與上傳邏輯相同的處理方式）
      const text = await file.text()
      // 默認使用 char_first 格式，與原上傳邏輯保持一致
      const builtinService = new BuiltinCodeTableService()
      const { rawCodeTable } = BuiltinCodeTableService.parseRawCodeTable(text, 'char_first')
      
      // 更新方案的 rawCodeTable
      scheme.rawCodeTable = rawCodeTable
      scheme.charCount = await calculateCharCountFromRaw(rawCodeTable)
      
      // 重新預處理數據
      const result = await preprocessCodeTableDataComplete(rawCodeTable, scheme.isPrefix, scheme.prefixKeys)
      scheme.processedTables = result.processedTables
      scheme.allUniqueChars = result.allUniqueChars
      scheme.charsetMap = result.charsetMap
      scheme.maxLength = result.maxLength
      
      // 清除舊的計算數據，強制重新計算
      scheme.data = {}
      
      // 根據當前Tab計算對應數據
      await calculateMissingData(scheme)
      
      // 保存更新
      saveComparisonData()
      
      console.log(`成功重新上傳方案 ${scheme.name} 的碼表文件`)
    } catch (error) {
      console.error(`重新上傳方案 ${scheme.name} 失敗:`, error)
      alert(`重新上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      scheme.isCalculating = false
      // 清理文件輸入元素
      document.body.removeChild(fileInput)
    }
  }
  
  // 添加到 DOM 並觸發點擊
  document.body.appendChild(fileInput)
  fileInput.click()
}

// 清除所有額外添加的方案
function clearAllSchemes() {
  if (additionalSchemes.value.length > 0) {
    additionalSchemes.value = []
    saveComparisonData()
  }
}
</script>

<style scoped>
@import '../styles/card-common.css';
@import '../styles/tabs-common.css';

/* 卡片根元素样式 */
.comparison-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 後台計算進度指示器 */
.background-progress {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
}

.progress-percentage {
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 500;
}

.progress-bar {
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0f766e, #14b8a6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 为暗黑模式创建更深沉的渐变 */
[data-theme="dark"] .progress-fill {
  background: linear-gradient(90deg, #064e3b, #0d9488);
}

.collapse-button svg.rotated {
  transform: rotate(180deg);
}

/* 原有样式 */
/* 空狀態樣式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 0.875rem;
}

/* 隱藏方案提示樣式 */
.hidden-schemes-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 16px 0;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  border: 1px solid #f59e0b;
  gap: 8px;
}

/* 为暗黑模式创建更深沉的渐变 */
[data-theme="dark"] .hidden-schemes-notice {
  background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
  border: 1px solid #a16207;
}

.notice-icon {
  font-size: 1.2rem;
}

.notice-text {
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 500;
}

.primary-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 为暗黑模式创建更深沉的渐变 */
[data-theme="dark"] .primary-btn {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 對比表格樣式 */
.comparison-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comparison-table {
  width: 100%;
  min-width: max-content; /* 内容所需的最小宽度 */
  border-collapse: collapse;
  font-size: 0.8rem;
  table-layout: auto; /* 允许浏览器自动调整列宽 */
}

.comparison-table th,
.comparison-table td {
  padding: 6px 4px;
  text-align: center;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  line-height: 1.2;
  white-space: nowrap; /* 防止文字换行 */
  min-width: 0; /* 允许列宽压缩到最小 */
  max-width: none; /* 不限制最大宽度 */
}

.comparison-table th:last-child,
.comparison-table td:last-child {
  border-right: none;
}

.comparison-table thead tr:last-child th {
  border-bottom: 2px solid #d1d5db;
}

.comparison-table tbody tr:last-child td {
  border-bottom: none;
}

.scheme-name-header {
  background: var(--color-bg-tertiary);
  width: auto; /* 改为自动宽度 */
  min-width: 60px; /* 较小的最小宽度 */
  text-align: left !important;
  font-weight: 600;
  color: var(--color-text-primary);
}

.char-count-header {
  background: var(--color-bg-tertiary);
  width: auto;
  min-width: 80px;
  text-align: center !important;
  font-weight: 600;
  color: var(--color-text-primary);
}

.char-count-header small {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.char-count {
  text-align: center;
  padding: 8px 12px;
  font-weight: 500;
}

.metric-header {
  background: var(--color-bg-tertiary);
  width: auto; /* 改为自动宽度 */
  min-width: 40px; /* 较小的最小宽度 */
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 可排序的表頭樣式 */
.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable:hover {
  background: #f3f4f6 !important;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.sort-arrow {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: bold;
  min-width: 12px;
  text-align: center;
}

.metric-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.metric-header-content span {
  font-size: 0.7rem;
  line-height: 1.1;
  text-align: center;
}

.metric-header-content small {
  font-size: 0.6rem;
  opacity: 0.7;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.actions-header {
  background: var(--color-bg-tertiary);
  width: 60px;
  min-width: 60px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.scheme-row:hover {
  background: #f9fafb;
}

.scheme-name {
  text-align: left !important;
}

.scheme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scheme-title {
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: help;
}

.scheme-source {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.scheme-source.warning {
  color: #d97706;
  font-weight: 500;
}

.metric-cell {
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.calculating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6b7280;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.metric-value {
  font-weight: 600;
  color: #059669;
}

.remove-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  font-size: 0.8rem;
}

.remove-btn:hover {
  background: #fef2f2;
}

.refresh-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  font-size: 0.8rem;
  margin-right: 4px;
}

.refresh-btn:hover {
  background: #f0f9ff;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn:disabled:hover {
  background: none;
}

.reupload-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  font-size: 0.8rem;
  margin-right: 4px;
  color: #d97706;
}

.reupload-btn:hover {
  background: #fef3cd;
}

/* 添加方案按鈕 */
.add-scheme-section {
  text-align: center;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.add-scheme-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-scheme-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.add-scheme-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-all-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.clear-all-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* 添加表單覆蓋層 */
.add-form-overlay {
  position: fixed; /* 固定定位，相对于视口 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6); /* 更深的背景色 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999; /* 極高的z-index值確保在最上層 */
  backdrop-filter: blur(4px); /* 背景模糊效果 */
  animation: fadeIn 0.2s ease-out; /* 淡入動畫 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.add-form {
  background: white;
  border-radius: 16px; /* 更大的圆角 */
  width: 90%;
  max-width: 600px; /* 增大最大宽度 */
  max-height: 85vh; /* 调整最大高度 */
  overflow-y: auto;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05); /* 多层阴影效果 */
  transform: scale(1);
  animation: slideIn 0.3s ease-out; /* 滑入动画 */
  border: 1px solid rgba(255, 255, 255, 0.2); /* 微妙的边框 */
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.form-header h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #374151;
}

.form-content {
  padding: 25px;
}

.form-section {
  margin-bottom: 18px;
}

.form-section h5 {
  margin: 0 0 6px 0;
  font-size: 0.95rem;
  color: #374151;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 8px 0;
  font-size: 0.82rem;
  color: #6b7280;
}

.builtin-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.builtin-options .scheme-select {
  flex: 1;
}

/* 多選容器樣式 */
.multi-select-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-all-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.select-all-btn,
.clear-selection-btn {
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 3px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-all-btn:hover,
.clear-selection-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.select-all-btn:disabled,
.clear-selection-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-count {
  margin-left: auto;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.scheme-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
}

.scheme-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.85rem;
  line-height: 1.2;
}

.scheme-checkbox:hover {
  background: #f3f4f6;
}

.checkbox-input {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 2px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-input:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-label {
  flex: 1;
  color: #374151;
  font-size: 0.85rem;
  line-height: 1.2;
}

.batch-add-controls {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.add-selected-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.add-selected-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-selected-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.upload-tips {
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  color: #0369a1;
  font-size: 0.85rem;
  line-height: 1.4;
}

.upload-tips small {
  display: block;
  font-size: inherit;
}

.prefix-toggle-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.prefix-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.prefix-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 2px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prefix-checkbox:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.prefix-label {
  font-weight: 500;
  color: #374151;
}

.prefix-desc {
  color: #6b7280;
  font-size: 0.8rem;
}

.scheme-select,
.file-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.add-btn,
.upload-btn,
.add-all-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.add-all-btn {
  background: #3b82f6;
}

.add-btn:hover:not(:disabled),
.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.add-all-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-btn:disabled,
.upload-btn:disabled,
.add-all-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.form-divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
  z-index: 0;
}

.form-divider span {
  background: white;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .comparison-table {
    font-size: 0.7rem;
  }
  
  .comparison-table th,
  .comparison-table td {
    padding: 4px 3px;
    line-height: 1.1;
  }
  
  .scheme-name-header {
    width: 90px;
    min-width: 90px;
  }
  
  .metric-header {
    width: 65px;
    min-width: 65px;
  }
  
  .metric-header-content span {
    font-size: 0.6rem;
  }
  
  .metric-header-content small {
    font-size: 0.5rem;
  }
  
  .sort-arrow {
    font-size: 0.7rem;
  }
  
  .header-title {
    gap: 2px;
  }
  
  .actions-header {
    width: 50px;
    min-width: 50px;
  }
  
  .add-form {
    width: 95%;
    margin: 20px;
  }
  
  .builtin-options,
  .upload-area {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Custom Tooltip Styles */
.custom-tooltip {
  position: fixed;
  background: #1f2937;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #374151;
}

.custom-tooltip::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

/* 暗黑模式專用樣式 */
[data-theme="dark"] .comparison-table-container {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .comparison-table {
  background: var(--color-bg-primary);
}

[data-theme="dark"] .comparison-table th {
  color: var(--color-text-primary);
  border-color: var(--color-border-secondary);
}

[data-theme="dark"] .comparison-table td {
  color: var(--color-text-primary);
  border-color: var(--color-border-secondary);
}

[data-theme="dark"] .comparison-table thead tr:last-child th {
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .actions-header {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .scheme-name-cell {
  color: var(--color-text-primary);
}

[data-theme="dark"] .char-count-cell {
  color: var(--color-text-primary);
}

[data-theme="dark"] .metric-cell {
  color: var(--color-text-primary);
}

[data-theme="dark"] .empty-state {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .empty-state h4 {
  color: var(--color-text-primary);
}

[data-theme="dark"] .empty-state p {
  color: var(--color-text-secondary);
}
</style>
