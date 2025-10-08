import { markRawList } from '@common/utils/vueTools'
import { markRaw } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'
import { sortInsert, similar } from '@common/utils/common'
import { toNewMusicInfo } from '@renderer/utils'

import type { ListInfoItem } from './state'
import { sources, maxPages, listInfos } from './state'

interface SearchResult {
  list: ListInfoItem[]
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 按搜索关键词重新排序列表
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: ListInfoItem[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, item.name),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}


let maxTotals: Partial<Record<LX.OnlineSource, number>> = {

}
const setLists = (results: SearchResult[], page: number, text: string): ListInfoItem[] => {
  let totals = []
  let limit = 0
  let list = []
  for (const source of results) {
    list.push(...source.list)
    totals.push(source.total)
    maxTotals[source.source] = source.total
    maxPages[source.source] = Math.ceil(source.total / source.limit)
    limit = Math.max(source.limit, limit)
  }
  markRawList(list)

  let listInfo = listInfos.all
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  listInfo.page = page
  listInfo.list = handleSortList(list, text)
  if (text && !list.length && page == 1) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): ListInfoItem[] => {
  // console.log(datas.source, datas.list)
  let listInfo = listInfos[datas.source]!
  listInfo.list = markRawList(datas.list)
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.page = page
  listInfo.limit = datas.limit
  if (text && !datas.list.length && page == 1) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

export const resetListInfo = (sourceId: LX.OnlineSource | 'all'): [] => {
  let listInfo = listInfos[sourceId]!
  listInfo.page = 1
  listInfo.limit = 20
  listInfo.total = 0
  listInfo.list = []
  listInfo.key = null
  listInfo.noItemLabel = ''
  listInfo.tagId = ''
  listInfo.sortId = ''
  return []
}

const loadDefaultQuranContent = async(sourceId: LX.OnlineSource, page: number): Promise<ListInfoItem[]> => {
  const listInfo = listInfos[sourceId]!
  listInfo.noItemLabel = window.i18n.t('list__loading')
  listInfo.key = `default_${page}__${sourceId}`
  
  try {
    const result = await music[sourceId]?.songList.search('', page, listInfo.limit)
    
    if (result?.list?.length) {
      const transformedList = result.list.map((s: any) => {
        return markRaw(toNewMusicInfo(s))
      })
      listInfo.list = markRawList(transformedList)
      listInfo.total = result.total
      listInfo.page = page
      listInfo.noItemLabel = ''
      return listInfo.list
    } else {
      listInfo.noItemLabel = window.i18n.t('no_item')
      return []
    }
  } catch (error) {
    console.error('❌ Error loading default Quran content:', error)
    listInfo.noItemLabel = window.i18n.t('list__load_failed')
    return []
  }
}

export const search = async(text: string, page: number, sourceId: LX.OnlineSource | 'all'): Promise<ListInfoItem[]> => {
  const listInfo = listInfos[sourceId]!
  if (!text) {
    // For Quran source, show default reciters when no search text
    if (sourceId === 'quran') {
      try {
        return await loadDefaultQuranContent(sourceId, page)
      } catch (error) {
        console.error('❌ Error in loadDefaultQuranContent:', error)
        throw error
      }
    }
    return resetListInfo(sourceId)
  }
  const key = `${page}__${sourceId}__${text}`
  
  // For Quran source, skip cache to force transformation
  if (sourceId === 'quran') {
    // Skip cache for Quran source
  } else if (listInfo.key == key && listInfo.list.length) {
    return listInfo.list
  }
  if (sourceId == 'all') {
    listInfo.noItemLabel = window.i18n.t('list__loading')
    listInfo.key = key
    let task = []
    for (const source of sources) {
      if (source == 'all' || (page > 1 && page > (maxPages[source]!))) continue
      task.push((music[source]?.songList.search(text, page, listInfos.all.limit) ?? Promise.reject(new Error('source not found: ' + source))).catch((error: any) => {
        console.log(error)
        return {
          list: [],
          total: 0,
          limit: listInfos.all.limit,
          source,
        }
      }))
    }
    return Promise.all(task).then((results: SearchResult[]) => {
      if (key != listInfo.key) return []
      return setLists(results, page, text)
    })
  } else {
    if (listInfo?.key == key && listInfo?.list.length) return listInfo?.list
    listInfo.noItemLabel = window.i18n.t('list__loading')
    listInfo.key = key
    
    
    return (music[sourceId]?.songList.search(text, page, listInfo.limit).then((data: SearchResult) => {
      if (key != listInfo.key) return []
      return setList(data, page, text)
    }) ?? Promise.reject(new Error('source not found: ' + sourceId))).catch((error: any) => {
      resetListInfo(sourceId)
      listInfo.noItemLabel = window.i18n.t('list__load_failed')
      console.log(error)
      throw error
    })
  }
}

