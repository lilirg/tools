/**
 * SignaturePad - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var SignatureConfig = {
    // ===== 画布引擎默认配置 =====
    ENGINE: {
      penColor: '#1a1a1a',
      penWidth: 2,
      bgColor: 'transparent',
      maxUndoSteps: 20,

      // 手写仿真
      velocitySensitive: true,
      minWidth: 0.5,
      maxWidth: 6,
      taperEffect: true,
      taperLength: 8,
      opacityEffect: true,
      minOpacity: 0.6,
      maxOpacity: 1.0,
    },

    // ===== UI交互层默认配置 =====
    UI: {
      width: 700,
      height: 300,
      placeholder: '请在此处签名',
      title: '手写签名',
      uploadUrl: '',
      uploadFieldName: 'file',
      uploadHeaders: {},
      uploadExtraData: {},
      onSave: null,
      onUpload: null,
      onUploadError: null,
      onClose: null,
      onClear: null,
      autoUpload: true,
      showUndo: true,
      responsive: true,
    }
  }

  // 暴露到全局
  global.SignatureConfig = SignatureConfig

})(typeof window !== 'undefined' ? window : this)