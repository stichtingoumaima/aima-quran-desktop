import apiSourceInfo from './api-source-info'
import { apiSource, userApi } from '@renderer/store'
// import api_temp_kw from './kw/api-temp'
// // import api_test_bd from './bd/api-test'
// import api_test_tx from './tx/api-test'
// import api_test_kg from './kg/api-test'
// import api_test_kw from './kw/api-test'
// import api_test_mg from './mg/api-test'
// import api_test_wy from './wy/api-test'

import api_test_quran from './quran/api-test'
import api_test_youtube from './youtube/api-test'

const allApi = {
  // temp_kw: api_temp_kw,
  // // test_bd: api_test_bd,
  // test_tx: api_test_tx,
  // test_kg: api_test_kg,
  // test_kw: api_test_kw,
  // test_mg: api_test_mg,
  // test_wy: api_test_wy,
  test_quran: api_test_quran,
  test_api_quran: api_test_quran, // Add alias for the mapping logic
  temp_quran: api_test_quran, // Use the same API for temp source
  temp_api_quran: api_test_quran, // Add alias for the mapping logic
  test_youtube: api_test_youtube,
  test_api_youtube: api_test_youtube, // Add alias for the mapping logic
  temp_youtube: api_test_youtube, // Use the same API for temp source
  temp_api_youtube: api_test_youtube, // Add alias for the mapping logic
  // Direct mapping for quran source
  quran: api_test_quran,
}

const apiList = {}
const supportQuality = {}

for (const api of apiSourceInfo) {
  console.log('🔧 Processing API source:', api.id, api.supportQualitys)
  supportQuality[api.id] = api.supportQualitys
  for (const source of Object.keys(api.supportQualitys)) {
    const key = `${api.id}_api_${source}`
    const apiModule = allApi[`${api.id}_${source}`]
    console.log('🔗 Mapping:', key, '->', !!apiModule)
    apiList[key] = apiModule
  }
}

const getAPI = source => {
  // Check for direct mapping first (for quran source)
  if (allApi[source]) {
    console.log('🔑 getAPI found direct mapping for:', source)
    return allApi[source]
  }

  const key = `${apiSource.value}_api_${source}`
  console.log('🔑 getAPI looking for key:', key)
  console.log('📋 Available API keys:', Object.keys(apiList))
  return apiList[key]
}

const apis = source => {
  console.log('🔌 apis() called with source:', source, 'apiSource.value:', apiSource.value)
  if (/^user_api/.test(apiSource.value)) return userApi.apis[source]
  let api = getAPI(source)
  console.log('🔍 getAPI returned:', !!api, api ? 'API found' : 'API not found')
  if (api) return api
  throw new Error('Api is not found')
}

export { apis, supportQuality }
