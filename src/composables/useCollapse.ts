import { ref } from 'vue'

export function useCollapse(initialState = false) {
  const isCollapsed = ref(initialState)

  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
  }

  const collapse = () => {
    isCollapsed.value = true
  }

  const expand = () => {
    isCollapsed.value = false
  }

  return {
    isCollapsed,
    toggleCollapsed,
    collapse,
    expand
  }
}
