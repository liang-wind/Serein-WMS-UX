/* ============================================================
   海外仓 WMS · 业务数据层
   所有表格由 WMS.DB 渲染，操作会真实改写状态并回流到界面。
   status 值与 UI 徽章映射见 detail.js  STATUS
   ============================================================ */
window.WMS = window.WMS || {};

WMS.DB = {

  /* ================= 入库 ASN ================= */
  asn: [
    {
      id:'ASN-20261011-0142', tenant:'深圳致远电子', supplier:'深圳致远电子', contact:'李敏', phone:'+86 755 8812 4471',
      wh:'LAX-01', mode:'海运', box:320, got:218, eta:'10-11 14:00', status:'receiving',
      dock:'月台 D2', created:'10-08 09:12', creator:'陈工', container:'MSCU7723841',
      weight:'4,180 kg', po:'PO-2026-90412', note:'',
      items:[
        {sku:'SKU-88231', name:'便携式榨汁杯 450ml', lot:'B2604-0912', qty:120},
        {sku:'SKU-33478', name:'不锈钢保温杯 500ml', lot:'B2604-0915', qty:86},
        {sku:'SKU-20865', name:'宠物自动饮水机 2.4L', lot:'B2604-0921', qty:64},
        {sku:'SKU-44122', name:'蓝牙自拍杆 三脚架款', lot:'B2604-0930', qty:50}
      ],
      timeline:[
        {t:'10-08 09:12', title:'ASN 已创建', meta:'陈工 · PO-2026-90412', state:'done'},
        {t:'10-10 17:40', title:'到港预约确认', meta:'月台 D2 · 10-11 14:00', state:'done'},
        {t:'10-11 14:20', title:'收货扫码进行中', meta:'218 / 320 箱 · 收货员 王大力', state:'active'},
        {t:'—', title:'质检验收', meta:'待开始', state:'pending'},
        {t:'—', title:'上架入位', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'ASN-20261011-0141', tenant:'义乌恒发家居', supplier:'义乌恒发家居', contact:'张成', phone:'+86 579 8663 1120',
      wh:'EWR-02', mode:'空运', box:118, got:0, eta:'10-11 16:30', status:'booked',
      dock:'月台 D4', created:'10-09 10:20', creator:'王运营', container:'航空板 AKE-22914',
      weight:'860 kg', po:'PO-2026-90418', note:'',
      items:[
        {sku:'SKU-71904', name:'折叠收纳箱 66L 三件套', lot:'B2604-0908', qty:76},
        {sku:'SKU-11708', name:'棉麻窗帘 200×270cm', lot:'B2604-0911', qty:42}
      ],
      timeline:[
        {t:'10-09 10:20', title:'ASN 已创建', meta:'王运营 · PO-2026-90418', state:'done'},
        {t:'10-10 11:05', title:'航班已确认', meta:'CA1086 · 10-11 12:40 抵 EWR', state:'done'},
        {t:'10-11 16:30', title:'预约到仓', meta:'月台 D4 · 待卸货', state:'active'},
        {t:'—', title:'收货扫码', meta:'待开始', state:'pending'},
        {t:'—', title:'质检验收 / 上架', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'ASN-20261011-0138', tenant:'东莞精工五金', supplier:'东莞精工五金', contact:'周立', phone:'+86 769 2288 5507',
      wh:'BHX-03', mode:'铁运', box:542, got:542, eta:'10-11 09:15', status:'inspecting',
      dock:'月台 D1', created:'10-05 14:02', creator:'刘主管', container:'中欧班列 X8172',
      weight:'6,420 kg', po:'PO-2026-90388', note:'',
      items:[
        {sku:'SKU-56012', name:'LED 感应夜灯 磁吸款', lot:'B2604-0831', qty:300},
        {sku:'SKU-33478', name:'不锈钢保温杯 500ml', lot:'B2604-0902', qty:242}
      ],
      timeline:[
        {t:'10-05 14:02', title:'ASN 已创建', meta:'刘主管 · PO-2026-90388', state:'done'},
        {t:'10-09 20:15', title:'班列到站', meta:'华沙中转 · 已发运', state:'done'},
        {t:'10-11 09:15', title:'收货完成', meta:'542 / 542 箱 · 无短装', state:'done'},
        {t:'10-11 10:02', title:'质检验收中', meta:'抽检 10% · 质检员 赵小雨', state:'active'},
        {t:'—', title:'上架入位', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'ASN-20261010-0131', tenant:'宁波海诚日用', supplier:'宁波海诚日用', contact:'陈海', phone:'+86 574 8722 3390',
      wh:'LAX-01', mode:'快递', box:76, got:76, eta:'10-10 07:40', status:'error',
      dock:'月台 D2', created:'10-07 16:48', creator:'陈工', container:'DHL 7741-8820-6',
      weight:'412 kg', po:'PO-2026-90401',
      note:'短装 4 箱（应到 80 实到 76），外箱破损 2 箱。已通知供应商补发，预计 10-14 到仓。',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', lot:'B2604-0901', qty:40},
        {sku:'SKU-11708', name:'棉麻窗帘 200×270cm', lot:'B2604-0903', qty:36}
      ],
      timeline:[
        {t:'10-07 16:48', title:'ASN 已创建', meta:'陈工 · PO-2026-90401', state:'done'},
        {t:'10-10 07:40', title:'到仓签收', meta:'月台 D2 · 快递直送', state:'done'},
        {t:'10-10 08:26', title:'收货完成', meta:'76 / 80 箱 · 短装 4 箱', state:'done'},
        {t:'10-10 09:10', title:'验收异常挂起', meta:'短装 + 破损 · 待处理', state:'error'},
        {t:'—', title:'索赔 / 补发', meta:'待处理', state:'pending'}
      ]
    },
    {
      id:'ASN-20261010-0127', tenant:'苏州明达玩具', supplier:'苏州明达玩具', contact:'吴晓', phone:'+86 512 6688 4402',
      wh:'FRA-04', mode:'海运', box:264, got:264, eta:'10-10 13:20', status:'putaway',
      dock:'月台 D3', created:'10-04 11:30', creator:'王运营', container:'CMAU3319075',
      weight:'2,960 kg', po:'PO-2026-90366', note:'',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', lot:'B2604-0905', qty:164},
        {sku:'SKU-71904', name:'折叠收纳箱 66L 三件套', lot:'B2604-0906', qty:100}
      ],
      timeline:[
        {t:'10-04 11:30', title:'ASN 已创建', meta:'王运营 · PO-2026-90366', state:'done'},
        {t:'10-10 13:20', title:'到港提柜', meta:'汉堡港 · 已发运 FRA-04', state:'done'},
        {t:'10-10 15:04', title:'收货完成', meta:'264 / 264 箱', state:'done'},
        {t:'10-10 16:12', title:'验收通过', meta:'合格 264 · 不良 0', state:'done'},
        {t:'10-11 08:30', title:'上架入位中', meta:'已完成 180 / 264 箱', state:'active'}
      ]
    },
    {
      id:'ASN-20261009-0119', tenant:'泉州鞋业外贸', supplier:'泉州鞋业外贸', contact:'林芳', phone:'+86 595 2255 8814',
      wh:'EWR-02', mode:'海运', box:890, got:890, eta:'10-09 11:00', status:'done',
      dock:'月台 D2', created:'10-01 09:05', creator:'刘主管', container:'TGHU8841220',
      weight:'9,840 kg', po:'PO-2026-90341', note:'',
      items:[
        {sku:'SKU-11708', name:'棉麻窗帘 200×270cm', lot:'B2604-0825', qty:420},
        {sku:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', lot:'B2604-0826', qty:470}
      ],
      timeline:[
        {t:'10-01 09:05', title:'ASN 已创建', meta:'刘主管 · PO-2026-90341', state:'done'},
        {t:'10-09 11:00', title:'到港提柜', meta:'萨凡纳港', state:'done'},
        {t:'10-09 13:40', title:'收货完成', meta:'890 / 890 箱', state:'done'},
        {t:'10-09 17:22', title:'验收通过', meta:'合格 888 · 不良 2（已换货）', state:'done'},
        {t:'10-10 10:15', title:'全部上架', meta:'库位 C-04-16 / D-06-22', state:'done'}
      ]
    },
    {
      id:'ASN-20261009-0112', tenant:'中山灯饰照明', supplier:'中山灯饰照明', contact:'郑明', phone:'+86 760 2233 7719',
      wh:'BHX-03', mode:'空运', box:45, got:0, eta:'10-12 08:30', status:'booked',
      dock:'月台 D5', created:'10-08 15:12', creator:'陈工', container:'航空板 AKE-23077',
      weight:'318 kg', po:'PO-2026-90425', note:'',
      items:[{sku:'SKU-56012', name:'LED 感应夜灯 磁吸款', lot:'B2604-0918', qty:45}],
      timeline:[
        {t:'10-08 15:12', title:'ASN 已创建', meta:'陈工 · PO-2026-90425', state:'done'},
        {t:'10-11 22:00', title:'航班起飞', meta:'CZ3017 · 预计 10-12 06:10 抵 BHX', state:'done'},
        {t:'10-12 08:30', title:'预约到仓', meta:'月台 D5 · 待卸货', state:'active'},
        {t:'—', title:'收货扫码', meta:'待开始', state:'pending'},
        {t:'—', title:'质检验收 / 上架', meta:'待开始', state:'pending'}
      ]
    }
  ],

  /* ================= 库存 SKU ================= */
  sku: [
    {
      id:'SKU-88231', name:'便携式榨汁杯 450ml', cat:'3C 电子', wh:'LAX-01', loc:'A-03-12',
      avail:12, lock:0, safety:50, status:'low', cost:'$3.42', supplier:'深圳致远电子',
      lastIn:'10-11', turnover:'42 天', velocity:'日均 38 件',
      bins:[{loc:'A-03-12', type:'存储位', qty:12, lock:0}, {loc:'A-03-13', type:'存储位', qty:0, lock:0}],
      batches:[{lot:'B2604-0912', qty:12, exp:'2027-04-12', in:'10-11'}],
      note:'低于安全线 38 件。近 7 日销量 266 件，按当前速度 0.4 天将售罄，建议今日补货。'
    },
    {
      id:'SKU-71904', name:'折叠收纳箱 66L 三件套', cat:'家居日用', wh:'EWR-02', loc:'C-11-04',
      avail:8420, lock:360, safety:1200, status:'ok', cost:'$5.80', supplier:'义乌恒发家居',
      lastIn:'10-11', turnover:'31 天', velocity:'日均 272 件',
      bins:[{loc:'C-11-04', type:'存储位', qty:5120, lock:180}, {loc:'C-11-05', type:'存储位', qty:3300, lock:180}],
      batches:[
        {lot:'B2604-0908', qty:5120, exp:'—', in:'10-11'},
        {lot:'B2603-0714', qty:3300, exp:'—', in:'09-02'}
      ],
      note:'周转健康。B2603-0714 批次库龄 39 天，优先出库。'
    },
    {
      id:'SKU-56012', name:'LED 感应夜灯 磁吸款', cat:'3C 电子', wh:'BHX-03', loc:'B-07-21',
      avail:0, lock:0, safety:300, status:'oos', cost:'$1.95', supplier:'东莞精工五金',
      lastIn:'09-28', turnover:'—', velocity:'日均 64 件',
      bins:[{loc:'B-07-21', type:'拣货位', qty:0, lock:0}],
      batches:[],
      note:'已缺货 3 天。关联 18 个待出库订单被阻塞，其中 5 单已超 SLA。ASN-0138 的 300 箱正在验收，通过后可恢复。'
    },
    {
      id:'SKU-33478', name:'不锈钢保温杯 500ml', cat:'家居日用', wh:'FRA-04', loc:'D-02-09',
      avail:2140, lock:88, safety:600, status:'ok', cost:'$2.76', supplier:'宁波海诚日用',
      lastIn:'10-10', turnover:'36 天', velocity:'日均 59 件',
      bins:[{loc:'D-02-09', type:'存储位', qty:1480, lock:40}, {loc:'D-02-10', type:'存储位', qty:660, lock:48}],
      batches:[
        {lot:'B2604-0915', qty:1480, exp:'—', in:'10-10'},
        {lot:'B2511-0330', qty:660, exp:'2026-10-08', in:'08-14'}
      ],
      note:'批次 B2511-0330 已于 10-08 过期，660 件需走报废流程（待主管审批）。'
    },
    {
      id:'SKU-20865', name:'宠物自动饮水机 2.4L', cat:'家居日用', wh:'LAX-01', loc:'A-09-03',
      avail:410, lock:1200, safety:400, status:'lock', cost:'$6.15', supplier:'中山灯饰照明',
      lastIn:'10-06', turnover:'28 天', velocity:'日均 43 件',
      bins:[{loc:'A-09-03', type:'存储位', qty:1610, lock:1200}],
      batches:[{lot:'B2604-0847', qty:1610, exp:'—', in:'10-06'}],
      note:'1,200 件被 6 张 FBA 大单预占（OUT-3549 等），待 UPS 交接后释放。'
    },
    {
      id:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', cat:'运动户外', wh:'EWR-02', loc:'C-04-16',
      avail:5730, lock:142, safety:800, status:'ok', cost:'$4.28', supplier:'泉州鞋业外贸',
      lastIn:'10-10', turnover:'34 天', velocity:'日均 168 件',
      bins:[{loc:'C-04-16', type:'存储位', qty:3830, lock:92}, {loc:'C-04-17', type:'存储位', qty:1900, lock:50}],
      batches:[
        {lot:'B2604-0905', qty:3830, exp:'—', in:'10-10'},
        {lot:'B2604-0901', qty:1900, exp:'—', in:'10-10'}
      ],
      note:'动销良好，无异常。'
    },
    {
      id:'SKU-44122', name:'蓝牙自拍杆 三脚架款', cat:'3C 电子', wh:'BHX-03', loc:'B-12-07',
      avail:62, lock:0, safety:250, status:'low', cost:'$2.10', supplier:'中山灯饰照明',
      lastIn:'09-30', turnover:'51 天', velocity:'日均 21 件',
      bins:[{loc:'B-12-07', type:'拣货位', qty:62, lock:0}],
      batches:[{lot:'B2604-0722', qty:62, exp:'—', in:'09-30'}],
      note:'低于安全线 188 件，3 天内将售罄。暂无在途 ASN，需新建补货。'
    },
    {
      id:'SKU-11708', name:'棉麻窗帘 200×270cm', cat:'家居日用', wh:'FRA-04', loc:'D-06-22',
      avail:1905, lock:0, safety:300, status:'slow', cost:'$7.90', supplier:'义乌恒发家居',
      lastIn:'10-09', turnover:'96 天', velocity:'日均 3 件',
      bins:[{loc:'D-06-22', type:'存储位', qty:1905, lock:0}],
      batches:[{lot:'B2604-0825', qty:1905, exp:'—', in:'10-09'}],
      note:'90 天无动销，占用 12 个库位。建议：① 参加欧洲站清仓活动 ② 合并至 EWR-02 集中处理。'
    }
  ],

  /* ================= 出库单 ================= */
  out: [
    {
      id:'OUT-20261011-3572', tenant:'安克创新科技', ch:'Amazon FBA', wh:'LAX-01', country:'美国', carrier:'UPS',
      tracking:'1Z884…4207', pieces:6, sla:'10-11 15:00', status:'handed', cost:'$8.64',
      customer:'Marcus T.', addr:'8420 Sunset Blvd, Los Angeles, CA 90069, US',
      items:[
        {sku:'SKU-71904', name:'折叠收纳箱 66L', qty:4, loc:'C-11-04'},
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:2, loc:'C-04-16'}
      ],
      timeline:[
        {t:'10-11 09:12', title:'订单下达', meta:'Amazon FBA 补货单', state:'done'},
        {t:'10-11 10:04', title:'拣货完成', meta:'拣货员 王大力 · 4 分 12 秒', state:'done'},
        {t:'10-11 10:38', title:'打包贴单', meta:'打包台 P-01 · 6 件', state:'done'},
        {t:'10-11 11:00', title:'交接 UPS', meta:'首趟揽收 · 1,204 件', state:'done'},
        {t:'—', title:'承运商扫描', meta:'等待揽收扫描', state:'active'}
      ]
    },
    {
      id:'OUT-20261011-3571', tenant:'中山灯饰照明', ch:'Shopify 独立站', wh:'EWR-02', country:'英国', carrier:'Royal Mail',
      tracking:'RM00…9134', pieces:2, sla:'10-11 16:00', status:'picking', cost:'£3.15',
      customer:'Sarah H.', addr:'12 Prince Albert Rd, London NW1 8SP, UK',
      items:[
        {sku:'SKU-44122', name:'蓝牙自拍杆', qty:1, loc:'B-12-07'},
        {sku:'SKU-56012', name:'LED 感应夜灯', qty:1, loc:'B-07-21'}
      ],
      note:'SKU-56012 在 BHX-03 缺货，本单已改由 EWR-02 同城仓发货。',
      timeline:[
        {t:'10-11 13:20', title:'订单下达', meta:'Shopify #10842', state:'done'},
        {t:'10-11 14:02', title:'分配仓库', meta:'EWR-02（BHX-03 缺货改派）', state:'done'},
        {t:'10-11 14:15', title:'拣货中', meta:'拣货员 赵小雨 · 2 / 2 已取', state:'active'},
        {t:'—', title:'打包贴单', meta:'待开始', state:'pending'},
        {t:'—', title:'交接承运商', meta:'SLA 16:00', state:'pending'}
      ]
    },
    {
      id:'OUT-20261011-3568', tenant:'苏州明达玩具', ch:'eBay', wh:'BHX-03', country:'德国', carrier:'DHL',
      tracking:'JD01…5580', pieces:11, sla:'10-11 17:30', status:'shipped', cost:'€9.42',
      customer:'Klaus W.', addr:'Hauptstr. 44, 10827 Berlin, Germany',
      items:[
        {sku:'SKU-56012', name:'LED 感应夜灯', qty:6, loc:'B-07-21'},
        {sku:'SKU-33478', name:'不锈钢保温杯', qty:5, loc:'D-02-09'}
      ],
      timeline:[
        {t:'10-11 08:40', title:'订单下达', meta:'eBay #22-8841', state:'done'},
        {t:'10-11 09:15', title:'拣货完成', meta:'拣货员 钱大力', state:'done'},
        {t:'10-11 09:50', title:'打包贴单', meta:'打包台 P-03', state:'done'},
        {t:'10-11 12:30', title:'已发运', meta:'DHL 截单 13:00 · 已赶上', state:'done'},
        {t:'10-11 20:14', title:'首次扫描', meta:'DHL Leipzig 分拣中心', state:'done'}
      ]
    },
    {
      id:'OUT-20261011-3560', tenant:'安克创新科技', ch:'Amazon FBM', wh:'LAX-01', country:'美国', carrier:'FedEx',
      tracking:'7712…0461', pieces:1, sla:'10-11 15:00', status:'stalled', cost:'$6.20',
      customer:'Jennifer R.', addr:'350 5th Ave, New York, NY 10118, US',
      items:[{sku:'SKU-88231', name:'便携式榨汁杯 450ml', qty:1, loc:'A-03-12'}],
      note:'轨迹停滞 26 小时，最后扫描停留在 FedEx Memphis 中转中心。已超 SLA 1 小时，需发起承运商查询。',
      timeline:[
        {t:'10-10 15:40', title:'订单下达', meta:'Amazon FBM', state:'done'},
        {t:'10-10 16:22', title:'拣货完成', meta:'拣货员 王大力', state:'done'},
        {t:'10-10 17:05', title:'交接 FedEx', meta:'末班截单', state:'done'},
        {t:'10-10 19:30', title:'首次扫描', meta:'FedEx Memphis', state:'done'},
        {t:'10-11 08:00', title:'轨迹停滞', meta:'逾 26h 无更新', state:'error'}
      ]
    },
    {
      id:'OUT-20261011-3554', tenant:'义乌恒发家居', ch:'Temu 半托管', wh:'FRA-04', country:'法国', carrier:'Colissimo',
      tracking:'CL93…2278', pieces:4, sla:'10-11 18:00', status:'waiting', cost:'€4.85',
      customer:'Camille D.', addr:'18 Rue de Rivoli, 75004 Paris, France',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:3, loc:'C-04-16'},
        {sku:'SKU-33478', name:'不锈钢保温杯', qty:1, loc:'D-02-09'}
      ],
      timeline:[
        {t:'10-11 12:05', title:'订单下达', meta:'Temu #FR-88214', state:'done'},
        {t:'10-11 12:10', title:'待拣货', meta:'已入波次 W-20261011-009', state:'active'},
        {t:'—', title:'拣货', meta:'SLA 18:00', state:'pending'},
        {t:'—', title:'打包贴单', meta:'待开始', state:'pending'},
        {t:'—', title:'交接承运商', meta:'19:30 夜间航班', state:'pending'}
      ]
    },
    {
      id:'OUT-20261011-3549', tenant:'深圳致远电子', ch:'Amazon FBA', wh:'EWR-02', country:'美国', carrier:'UPS',
      tracking:'1Z884…4188', pieces:24, sla:'10-11 18:00', status:'topack', cost:'$31.68',
      customer:'FBA 补货仓', addr:'Fulfillment Center, 55 Manor Pkwy, Edison, NJ 08837, US',
      items:[
        {sku:'SKU-20865', name:'宠物自动饮水机 2.4L', qty:18, loc:'A-09-03'},
        {sku:'SKU-71904', name:'折叠收纳箱 66L', qty:6, loc:'C-11-04'}
      ],
      note:'1,200 件库存因本批 FBA 大单锁定，交接后释放。',
      timeline:[
        {t:'10-11 11:30', title:'订单下达', meta:'FBA 补货计划', state:'done'},
        {t:'10-11 12:02', title:'拣货完成', meta:'拣货员 3 人协作 · 24 件', state:'done'},
        {t:'10-11 12:40', title:'待打包', meta:'已推送打包台 P-02', state:'active'},
        {t:'—', title:'称重贴单', meta:'待开始', state:'pending'},
        {t:'—', title:'交接 UPS', meta:'17:00 末班', state:'pending'}
      ]
    },
    {
      id:'OUT-20261011-3541', tenant:'乐歌家居科技', ch:'Shopify 独立站', wh:'BHX-03', country:'英国', carrier:'Royal Mail',
      tracking:'RM00…9102', pieces:3, sla:'10-11 19:00', status:'addrerr', cost:'£2.95',
      customer:'Oliver B.', addr:'7 Kingsway（缺门牌号与邮编）, London, UK',
      items:[
        {sku:'SKU-44122', name:'蓝牙自拍杆', qty:2, loc:'B-12-07'},
        {sku:'SKU-56012', name:'LED 感应夜灯', qty:1, loc:'B-07-21'}
      ],
      note:'收件地址缺门牌号与邮编，Royal Mail 无法生成面单。已通知客服联系买家，2 小时内未回复将退款处理。',
      timeline:[
        {t:'10-11 13:44', title:'订单下达', meta:'Shopify #10847', state:'done'},
        {t:'10-11 13:50', title:'拣货完成', meta:'3 件已取', state:'done'},
        {t:'10-11 14:02', title:'地址校验失败', meta:'缺门牌号 + 邮编', state:'error'},
        {t:'—', title:'等待客服补全', meta:'工单 CS-2291', state:'active'},
        {t:'—', title:'打包贴单', meta:'已暂停', state:'pending'}
      ]
    },
    {
      id:'OUT-20261011-3533', tenant:'中山灯饰照明', ch:'eBay', wh:'FRA-04', country:'德国', carrier:'DHL',
      tracking:'JD01…5541', pieces:8, sla:'10-11 20:00', status:'ready', cost:'€7.30',
      customer:'Anja S.', addr:'Ringstr. 12, 1010 Vienna, Austria',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:5, loc:'C-04-16'},
        {sku:'SKU-11708', name:'棉麻窗帘', qty:3, loc:'D-06-22'}
      ],
      timeline:[
        {t:'10-11 15:10', title:'订单下达', meta:'eBay #33-1174', state:'done'},
        {t:'10-11 15:35', title:'拣货完成', meta:'8 件已取', state:'done'},
        {t:'10-11 16:00', title:'打包完成', meta:'打包台 P-02', state:'done'},
        {t:'10-11 16:05', title:'待交接', meta:'已入 19:30 DHL 夜间航班清单', state:'active'},
        {t:'—', title:'承运商扫描', meta:'19:30 截单', state:'pending'}
      ]
    }
  ],

  /* ================= 库位 ================= */
  loc: [
    {id:'A-03-12', wh:'LAX-01', zone:'A 区', type:'存储位', own:'混放', sku:'SKU-88231', name:'便携式榨汁杯 450ml',
     fill:24, status:'part', cap:'120 件 / 500', batch:'B2604-0912', lastCount:'09-28', picker:'—',
     note:'水位偏低，已触发补货建议。'},
    {id:'A-01-04', wh:'LAX-01', zone:'A 区', type:'拣货位', own:'混放', sku:'SKU-33478', name:'不锈钢保温杯 500ml',
     fill:97, status:'full', cap:'485 件 / 500', batch:'B2604-0915', lastCount:'10-06', picker:'王大力',
     note:'拣货位满载，补货通道已被占用，建议转入 C 区溢出位。'},
    {id:'B-01-07', wh:'LAX-01', zone:'B 区', type:'存储位', own:'混放', sku:'—', name:'空闲',
     fill:0, status:'free', cap:'0 件 / 500', batch:'—', lastCount:'10-02', picker:'—',
     note:'可用库位，可分配给 ASN-20261011-0142。'},
    {id:'B-07-21', wh:'BHX-03', zone:'B 区', type:'拣货位', own:'混放', sku:'SKU-56012', name:'LED 感应夜灯 磁吸款',
     fill:0, status:'free', cap:'0 件 / 400', batch:'—', lastCount:'10-08', picker:'钱大力',
     note:'SKU-56012 已缺货 3 天，ASN-20261011-0138 的 300 箱验收后可补入。'},
    {id:'C-11-04', wh:'EWR-02', zone:'C 区', type:'存储位', own:'混放', sku:'SKU-71904', name:'折叠收纳箱 66L 三件套',
     fill:66, status:'part', cap:'5,120 件 / 8,000', batch:'B2604-0908', lastCount:'10-04', picker:'—',
     note:'水位正常，周转 31 天。'},
    {id:'D-02-09', wh:'FRA-04', zone:'D 区', type:'暂存位', own:'独占 · 乐歌家居', sku:'SKU-33478', name:'不锈钢保温杯 500ml',
     fill:41, status:'lock', cap:'1,480 件 / 3,600', batch:'B2604-0915', lastCount:'10-11', picker:'—',
     note:'循环盘点中（任务 CN-20261011-014），解锁将中断盘点。'},
    {id:'F-01-01', wh:'LAX-01', zone:'F 区', type:'退货位', own:'公共区', sku:'12 个 SKU', name:'退货暂存',
     fill:88, status:'full', cap:'148 件 / 170', batch:'多批次', lastCount:'10-09', picker:'赵小雨',
     note:'待质检退货 148 件，其中 42 件超 7 天未处理，需优先质检。'}
  ],

  /* ================= 报表 ================= */
  rpt: [
    {id:'RPT-01', name:'出入库吞吐日报', cat:'仓储作业', dim:'仓库维度', freq:'每日 06:00', owner:'陈工', subs:14,
     last:'10-11 06:00', status:'ok', range:'近 7 天 · 按日', unit:'箱',
     desc:'统计各仓每日入库、出库、在库结存与吞吐比。',
     cols:['日期','入库(箱)','出库(箱)','净结存','吞吐比'],
     rows:[
       ['10-11','1,284','3,572','-2,288','2.78'],
       ['10-10','1,184','3,345','-2,161','2.83'],
       ['10-09','1,260','3,520','-2,260','2.79'],
       ['10-08','1,140','3,180','-2,040','2.79'],
       ['10-07','1,310','3,410','-2,100','2.60'],
       ['10-06','1,180','3,320','-2,140','2.81'],
       ['10-05','1,020','3,100','-2,080','3.04']
     ],
     chart:{labels:['10-05','10-06','10-07','10-08','10-09','10-10','10-11'],
            a:[1020,1180,1310,1140,1260,1184,1284],
            b:[3100,3320,3410,3180,3520,3345,3572]},
     sum:['近 7 日入库 8,942 箱，出库 24,180 箱，净去库 15,238 箱','10-05 吞吐比最高 3.04，主因周日入库量偏低']},

    {id:'RPT-02', name:'拣货效率分析', cat:'仓储作业', dim:'人员维度', freq:'每周一 08:00', owner:'刘主管', subs:9,
     last:'10-06 08:00', status:'ok', range:'近 7 天 · 按仓', unit:'件/人时',
     desc:'按仓库统计拣货人均效率、错拣率与平均时长。',
     cols:['仓库','拣货员','人均效率','平均时长','错拣率'],
     rows:[
       ['LAX-01','12','148 件/h','4 分 12 秒','0.24%'],
       ['EWR-02','9','136 件/h','4 分 48 秒','0.31%'],
       ['BHX-03','7','122 件/h','5 分 30 秒','0.52%'],
       ['FRA-04','8','154 件/h','3 分 56 秒','0.18%']
     ],
     chart:null,
     sum:['全网人均 140 件/h，FRA-04 最优、BHX-03 最弱','BHX-03 错拣率 0.52% 高于阈值 0.4%，建议复查 B 区库位标签']},

    {id:'RPT-03', name:'库存周转与呆滞', cat:'库存分析', dim:'货主维度', freq:'每周五 18:00', owner:'陈工', subs:11,
     last:'10-10 18:00', status:'ok', range:'近 30 天 · 按品类', unit:'天',
     desc:'各品类周转天数、呆滞 SKU 数量与占用金额。',
     cols:['品类','SKU 数','周转天数','呆滞 SKU','占用金额'],
     rows:[
       ['家居日用','4,820','33.4','18','$286,400'],
       ['3C 电子','2,140','41.2','26','$198,700'],
       ['服饰鞋包','3,366','46.8','14','$142,900'],
       ['玩具母婴','2,521','29.6','6','$88,200']
     ],
     chart:null,
     sum:['全网周转 38.6 天，超出目标 3.6 天','呆滞 64 个 SKU 共占用 $71,300，占库存金额 2.1%']},

    {id:'RPT-04', name:'库容利用率周报', cat:'库存分析', dim:'仓库维度', freq:'每周一 08:00', owner:'王运营', subs:7,
     last:'10-06 08:00', status:'pending', range:'近 4 周 · 按仓', unit:'%',
     desc:'各仓库容利用率变化趋势与预警库区。',
     cols:['仓库','库容利用率','周环比','预警库区','可用库位'],
     rows:[
       ['LAX-01','78.4%','+1.2%','A 区 92%','1,240'],
       ['EWR-02','64.2%','-0.8%','—','2,180'],
       ['BHX-03','91.6%','+4.6%','B 区 94%','412'],
       ['FRA-04','47.3%','+0.4%','—','2,108']
     ],
     chart:null,
     sum:['BHX-03 连续 3 周上升，已超 90% 阈值','建议将 LAX-01 溢出库存分流至 EWR-02']},

    {id:'RPT-07', name:'货主履约时效明细', cat:'货主履约', dim:'货主维度', freq:'每周一 08:00', owner:'王运营', subs:8,
     last:'10-06 08:00', status:'ok', range:'近 7 天 · 按货主', unit:'小时',
     desc:'按货主统计订单履约时效、异常率与 SLA 达成情况。',
     cols:['货主','订单量','准时率','平均时效','异常率'],
     rows:[
       ['安克创新科技','1,204','96.8%','26.4h','1.2%'],
       ['深圳致远电子','986','97.2%','24.8h','0.9%'],
       ['乐歌家居科技','412','93.1%','41.2h','3.4%'],
       ['义乌恒发家居','388','95.4%','29.6h','2.1%']
     ],
     chart:null,
     sum:['整体准时率 96.2%，距 98% 目标差 1.8 个百分点','乐歌家居科技时效受大件拣货影响，异常率 3.4% 为最高']},

    {id:'RPT-05', name:'承运商运费对账', cat:'财务对账', dim:'承运商维度', freq:'每月 1 日 09:00', owner:'财务组', subs:5,
     last:'10-01 09:00', status:'ok', range:'上月 · 按承运商', unit:'USD',
     desc:'各承运商月度运费、单均成本与账单核对。',
     cols:['承运商','运单数','总运费','单均成本','差异'],
     rows:[
       ['UPS','18,402','$64,280','$3.49','0'],
       ['FedEx','9,118','$34,650','$3.80','-$142'],
       ['DHL','6,844','$28,920','$4.23','0'],
       ['Royal Mail','4,210','$13,470','$3.20','+$58'],
       ['Colissimo','2,986','$9,860','$3.30','0']
     ],
     chart:null,
     sum:['上月运费合计 $151,180，单均 $3.61','FedEx 差异 -$142、Royal Mail +$58，已发起核对']},

    {id:'RPT-06', name:'仓储服务费账单', cat:'财务对账', dim:'货主维度', freq:'每月 5 日 09:00', owner:'财务组', subs:6,
     last:'10-05 09:00', status:'failed', range:'上月 · 按仓', unit:'USD',
     desc:'仓储操作费、仓租、增值服务费分仓账单。',
     cols:['仓库','入库操作费','仓租','增值服务费','合计'],
     rows:[
       ['LAX-01','$18,420','$26,800','$4,120','$49,340'],
       ['EWR-02','$14,760','$21,400','$2,880','$39,040'],
       ['BHX-03','$9,320','$14,600','$1,940','$25,860'],
       ['FRA-04','$10,880','$16,200','$2,410','$29,490']
     ],
     chart:null,
     sum:['上次生成失败：汇率接口超时（10-05 09:04）','重试将按 10-11 汇率 1 EUR = 1.087 USD 重新计算']}
  ],

  /* ================= 用户 ================= */
  usr: [
    {id:'U01', name:'陈工', role:'管理员', whs:'LAX-01 · EWR-02', scope:'全部 18 家', phone:'138****2041',
     last:'10-11 09:12', status:'on', email:'chen@company.com',
     perms:{'仓储作业':1,'库存管理':1,'出库发货':1,'库位管理':1,'数据报表':1,'系统设置':1}},
    {id:'U02', name:'刘主管', role:'主管', whs:'LAX-01', scope:'致远 · 安克 · 东莞', phone:'139****7788',
     last:'10-11 08:47', status:'on', email:'liu@company.com',
     perms:{'仓储作业':1,'库存管理':1,'出库发货':1,'库位管理':1,'数据报表':1,'系统设置':0}},
    {id:'U03', name:'王运营', role:'主管', whs:'BHX-03 · FRA-04', scope:'乐歌 · 苏州 · 中山', phone:'137****5512',
     last:'10-10 19:30', status:'on', email:'wang@company.com',
     perms:{'仓储作业':1,'库存管理':1,'出库发货':1,'库位管理':0,'数据报表':1,'系统设置':0}},
    {id:'U04', name:'赵小雨', role:'操作员', whs:'EWR-02', scope:'义乌恒发', phone:'135****9034',
     last:'10-11 07:58', status:'on', email:'zhao@company.com',
     perms:{'仓储作业':1,'库存管理':1,'出库发货':1,'库位管理':0,'数据报表':0,'系统设置':0}},
    {id:'U05', name:'钱大力', role:'操作员', whs:'BHX-03', scope:'东莞精工', phone:'136****4420',
     last:'09-28 14:05', status:'off', email:'qian@company.com',
     perms:{'仓储作业':1,'库存管理':0,'出库发货':1,'库位管理':0,'数据报表':0,'系统设置':0}}
  ],

  /* ================= 通知 ================= */
  notify: [
    {lv:'high', title:'SKU-88231 低于安全库存', sub:'LAX-01 · 剩余 12 / 安全线 50', time:'4m', read:false, go:'inventory'},
    {lv:'high', title:'BHX-03 库容超限 91.6%', sub:'已触发扩容预警 · 建议分流至 EWR-02', time:'21m', read:false, go:'locations'},
    {lv:'mid',  title:'OUT-20261011-3560 轨迹停滞', sub:'FedEx · 逾 26h 无轨迹更新', time:'1h', read:false, go:'outbound'},
    {lv:'mid',  title:'ASN-20261010-0131 验收异常', sub:'短装 4 箱 + 破损 2 箱', time:'1d', read:true, go:'inbound'},
    {lv:'low',  title:'FRA-04 有 6 张盘点差异单待复核', sub:'差异合计 148 件 · 需主管审批', time:'5h', read:true, go:'inventory'}
  ],

  /* ================= 波次 / 盘点任务 ================= */
  wave: [
    {id:'W-20261011-007', wh:'LAX-01', orders:42, done:72, pickers:'4 人', sla:'15:00 截单'},
    {id:'W-20261011-006', wh:'EWR-02', orders:31, done:45, pickers:'3 人', sla:'16:00 截单'},
    {id:'W-20261011-005', wh:'BHX-03', orders:18, done:12, pickers:'2 人', sla:'17:00 截单'}
  ],
  countTask: [
    {id:'CN-20261011-014', wh:'FRA-04', zone:'D 区', mode:'循环盘点', diff:'148 件',
     owner:'王运营', status:'进行中', due:'10-11 18:00'},
    {id:'CN-20261011-015', wh:'LAX-01', zone:'A 区', mode:'动态盘点', diff:'—',
     owner:'刘主管', status:'待开始', due:'10-11 22:00'},
    {id:'CN-20261010-011', wh:'EWR-02', zone:'C 区', mode:'循环盘点', diff:'0',
     owner:'赵小雨', status:'已完成', due:'10-10 20:00'}
  ],

  /* ================= 订单池（OMS） ================= */
  order: [
    {
      id:'AMZ-114-982731', ch:'Amazon', tenant:'安克创新科技', pieces:3, skus:2,
      country:'US', city:'洛杉矶 90012', wh:'LAX-01', score:'就近 98 分', status:'held',
      carrier:'UPS', note:'库存已预占，等待下发生成出库单。',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:2},
        {sku:'SKU-88231', name:'便携式榨汁杯 450ml', qty:1}
      ],
      timeline:[
        {t:'10-11 08:40', title:'订单下达', meta:'Amazon SP-API 拉单', state:'done'},
        {t:'10-11 08:41', title:'地址解析通过', meta:'US · 洛杉矶 90012', state:'done'},
        {t:'10-11 08:41', title:'自动分仓 LAX-01', meta:'就近 98 分 · 库存深度达标', state:'done'},
        {t:'10-11 08:42', title:'库存预占成功', meta:'3 件已锁定', state:'done'},
        {t:'—', title:'下发 WMS', meta:'待执行', state:'pending'}
      ]
    },
    {
      id:'SHP-7721-0093', ch:'Shopify', tenant:'义乌恒发家居', pieces:1, skus:1,
      country:'US', city:'纽约 10001', wh:'无可用仓', score:'可用 0', status:'block',
      carrier:'—', note:'EWR-02 与 LAX-01 可用库存均为 0，需通知货主补货或渠道端下架。',
      items:[{sku:'SKU-71904', name:'折叠收纳箱 66L', qty:1}],
      timeline:[
        {t:'10-11 09:02', title:'订单下达', meta:'Shopify #10851', state:'done'},
        {t:'10-11 09:02', title:'分仓失败', meta:'4 个仓库可用库存均为 0', state:'error'},
        {t:'—', title:'处理缺货', meta:'待人工介入', state:'pending'}
      ]
    },
    {
      id:'EBY-3302-1187', ch:'eBay', tenant:'苏州明达玩具', pieces:5, skus:2,
      country:'DE', city:'柏林 10115', wh:'FRA + BHX', score:'拆 2 单', status:'assign',
      carrier:'DHL', note:'库存跨 FRA-04 / BHX-03 两仓，需拆单后分别计算运费。',
      items:[
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:3},
        {sku:'SKU-33478', name:'不锈钢保温杯', qty:2}
      ],
      timeline:[
        {t:'10-11 09:20', title:'订单下达', meta:'eBay #44-1187', state:'done'},
        {t:'10-11 09:21', title:'分仓命中拆单规则', meta:'跨仓库存 · 建议拆 2 单', state:'active'},
        {t:'—', title:'确认拆单', meta:'待确认', state:'pending'}
      ]
    },
    {
      id:'TP-9912-4402', ch:'Temu', tenant:'安克创新科技', pieces:2, skus:1,
      country:'US', city:'休斯顿 77002', wh:'EWR-02', score:'时效 91 分', status:'held',
      carrier:'UPS', note:'半托管订单，需在 24 小时内交接。',
      items:[{sku:'SKU-71904', name:'折叠收纳箱 66L', qty:2}],
      timeline:[
        {t:'10-11 09:30', title:'订单下达', meta:'Temu 半托管', state:'done'},
        {t:'10-11 09:31', title:'自动分仓 EWR-02', meta:'时效 91 分', state:'done'},
        {t:'10-11 09:31', title:'库存预占成功', meta:'2 件已锁定', state:'done'},
        {t:'—', title:'下发 WMS', meta:'待执行', state:'pending'}
      ]
    },
    {
      id:'AMZ-114-982688', ch:'Amazon', tenant:'安克创新科技', pieces:4, skus:1,
      country:'US', city:'西雅图 98101', wh:'LAX-01', score:'序列号 4/4', status:'held',
      carrier:'UPS', note:'3C 高价值商品，出库需逐件校验序列号。',
      items:[{sku:'SKU-88231', name:'便携式榨汁杯 450ml', qty:4}],
      timeline:[
        {t:'10-11 09:40', title:'订单下达', meta:'Amazon FBA 补货', state:'done'},
        {t:'10-11 09:41', title:'序列号校验通过', meta:'4 / 4 已绑定', state:'done'},
        {t:'10-11 09:41', title:'库存预占成功', meta:'4 件已锁定', state:'done'},
        {t:'—', title:'下发 WMS', meta:'待执行', state:'pending'}
      ]
    },
    {
      id:'SHP-7721-0088', ch:'Shopify', tenant:'中山灯饰照明', pieces:3, skus:3,
      country:'US', city:'偏远邮编 99801', wh:'地址超区', score:'无承运商覆盖', status:'block',
      carrier:'—', note:'阿拉斯加偏远邮编无尾程承运商覆盖，建议退回渠道端并通知货主客服。',
      items:[
        {sku:'SKU-44122', name:'蓝牙自拍杆', qty:1},
        {sku:'SKU-56012', name:'LED 感应夜灯', qty:1},
        {sku:'SKU-11708', name:'棉麻窗帘', qty:1}
      ],
      timeline:[
        {t:'10-11 09:52', title:'订单下达', meta:'Shopify #10853', state:'done'},
        {t:'10-11 09:53', title:'地址校验失败', meta:'邮编 99801 超出承运商覆盖', state:'error'},
        {t:'—', title:'退回渠道端', meta:'待确认', state:'pending'}
      ]
    },
    {
      id:'EBY-3302-1140', ch:'eBay', tenant:'中山灯饰照明', pieces:2, skus:1,
      country:'GB', city:'曼彻斯特 M1', wh:'BHX-03', score:'就近 96 分', status:'held',
      carrier:'Royal Mail', note:'',
      items:[{sku:'SKU-56012', name:'LED 感应夜灯', qty:2}],
      timeline:[
        {t:'10-11 10:02', title:'订单下达', meta:'eBay #44-1140', state:'done'},
        {t:'10-11 10:03', title:'自动分仓 BHX-03', meta:'就近 96 分', state:'done'},
        {t:'10-11 10:03', title:'库存预占成功', meta:'2 件已锁定', state:'done'},
        {t:'—', title:'下发 WMS', meta:'待执行', state:'pending'}
      ]
    },
    {
      id:'AMZ-114-982610', ch:'Amazon', tenant:'深圳致远电子', pieces:6, skus:2,
      country:'US', city:'芝加哥 60601', wh:'EWR-02', score:'就近 94 分', status:'sent',
      carrier:'UPS', note:'已下发 EWR-02，波次 W-20261011-006 拣货中。',
      items:[
        {sku:'SKU-71904', name:'折叠收纳箱 66L', qty:4},
        {sku:'SKU-99310', name:'瑜伽垫 TPE 8mm', qty:2}
      ],
      timeline:[
        {t:'10-11 10:12', title:'订单下达', meta:'Amazon FBA', state:'done'},
        {t:'10-11 10:13', title:'自动分仓 EWR-02', meta:'就近 94 分', state:'done'},
        {t:'10-11 10:14', title:'已下发 WMS', meta:'出库单 OUT-20261011-3595', state:'done'},
        {t:'10-11 10:40', title:'拣货中', meta:'波次 W-20261011-006', state:'active'}
      ]
    }
  ],

  /* ================= 退件单 ================= */
  ret: [
    {
      id:'RTN-20261011-0201', type:'FBA 移除', tenant:'深圳致远电子', wh:'LAX-01',
      qty:24, sku:'SKU-88231', name:'便携式榨汁杯 450ml', grade:'可售', status:'done',
      loc:'A-03-12', reason:'FBA 库存移除 · 包装完好',
      note:'质检判定可售，24 件已重新上架 A-03-12，计入可用库存。',
      timeline:[
        {t:'10-11 07:20', title:'退件到仓', meta:'FBA 移除单 24 件', state:'done'},
        {t:'10-11 08:05', title:'质检完成', meta:'可售 24 · 残损 0', state:'done'},
        {t:'10-11 08:40', title:'重新上架', meta:'A-03-12 · 已计入可用', state:'done'}
      ]
    },
    {
      id:'RTN-20261011-0198', type:'买家 RMA', tenant:'义乌恒发家居', wh:'EWR-02',
      qty:1, sku:'SKU-71904', name:'折叠收纳箱 66L', grade:'待翻新', status:'qc',
      loc:'F-01-01', reason:'买家退货 · 外包装破损',
      note:'外包装破损、内件完好，需翻新换新包装后重新上架。',
      timeline:[
        {t:'10-11 08:30', title:'退件到仓', meta:'买家 RMA · 1 件', state:'done'},
        {t:'10-11 09:10', title:'质检中', meta:'判定：待翻新', state:'active'},
        {t:'—', title:'翻新', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'RTN-20261011-0192', type:'FBA 移除', tenant:'苏州明达玩具', wh:'FRA-04',
      qty:36, sku:'SKU-11708', name:'棉麻窗帘 200×270cm', grade:'残损', status:'relabel',
      loc:'F-01-01', reason:'FBA 移除 · 全部残损不可售',
      note:'36 件外包装破损不可售，已进入待换标/报废决策队列，报废前需货主确认。',
      timeline:[
        {t:'10-10 16:10', title:'退件到仓', meta:'FBA 移除单 36 件', state:'done'},
        {t:'10-10 17:30', title:'质检完成', meta:'残损 36 · 不可售', state:'done'},
        {t:'—', title:'报废 / 换标决策', meta:'待货主确认', state:'active'}
      ]
    },
    {
      id:'RTN-20261011-0186', type:'派送失败', tenant:'深圳致远电子', wh:'LAX-01',
      qty:6, sku:'SKU-44122', name:'蓝牙自拍杆 三脚架款', grade:'可售', status:'arrive',
      loc:'月台 D2', reason:'派送失败退回 · 地址错误',
      note:'承运商退回件已预约 10-12 10:00 月台 D2 收货。',
      timeline:[
        {t:'10-11 11:00', title:'退回登记', meta:'Royal Mail 派送失败', state:'done'},
        {t:'—', title:'预约收货', meta:'10-12 10:00 · 月台 D2', state:'active'}
      ]
    },
    {
      id:'RTN-20261011-0181', type:'FBA 移除', tenant:'东莞精工五金', wh:'LAX-01',
      qty:12, sku:'SKU-56012', name:'LED 感应夜灯 磁吸款', grade:'可售', status:'relabel',
      loc:'F-01-01', reason:'FBA 移除 · 需换 FNSKU',
      note:'商品可售，但需更换 FNSKU 标签后方可重新入仓。',
      timeline:[
        {t:'10-11 09:40', title:'退件到仓', meta:'FBA 移除单 12 件', state:'done'},
        {t:'10-11 10:20', title:'质检完成', meta:'可售 12 · 需换标', state:'done'},
        {t:'—', title:'换标', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'RTN-20261011-0175', type:'买家 RMA', tenant:'深圳致远电子', wh:'LAX-01',
      qty:2, sku:'SKU-33478', name:'不锈钢保温杯 500ml', grade:'可售', status:'done',
      loc:'D-02-09', reason:'买家退货 · 序列号核验通过',
      note:'序列号 SN-A8842 / SN-A8843 已核验并重新上架。',
      timeline:[
        {t:'10-11 07:50', title:'退件到仓', meta:'买家 RMA · 2 件', state:'done'},
        {t:'10-11 08:30', title:'质检完成', meta:'序列号核验通过', state:'done'},
        {t:'10-11 08:45', title:'重新上架', meta:'D-02-09', state:'done'}
      ]
    },
    {
      id:'RTN-20261011-0170', type:'派送失败', tenant:'中山灯饰照明', wh:'BHX-03',
      qty:3, sku:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', grade:'待翻新', status:'qc',
      loc:'F-01-01', reason:'买家拒收 · 需重新包装',
      note:'买家拒收退回，3 件需重新包装后翻新。',
      timeline:[
        {t:'10-11 10:30', title:'退件到仓', meta:'派送失败 · 3 件', state:'done'},
        {t:'10-11 11:15', title:'质检中', meta:'判定：待翻新', state:'active'},
        {t:'—', title:'翻新', meta:'待开始', state:'pending'}
      ]
    },
    {
      id:'RTN-20261011-0164', type:'FBA 移除', tenant:'乐歌家居科技', wh:'BHX-03',
      qty:48, sku:'SKU-20865', name:'宠物自动饮水机 2.4L', grade:'待翻新', status:'qc',
      loc:'F-01-01', reason:'FBA 移除 · 批量质检中',
      note:'批量质检进行中：已完成 36 / 48 件。',
      qcDone:36,
      timeline:[
        {t:'10-11 09:00', title:'退件到仓', meta:'FBA 移除单 48 件', state:'done'},
        {t:'10-11 10:00', title:'批量质检中', meta:'36 / 48 件', state:'active'},
        {t:'—', title:'分级处置', meta:'待完成', state:'pending'}
      ]
    }
  ],

  /* ================= 换标与处置队列 ================= */
  retn: [
    {id:'RL-20261011-0042', src:'RTN-20261011-0181', tenant:'东莞精工五金',
     sku:'SKU-56012', qty:12, act:'换标', tag:'X002ABCD', owner:'陈工', status:'printing', wh:'LAX-01',
     note:'12 张 FNSKU 标签生成中，完成后送至 LAX-01 标签打印机。'},
    {id:'RL-20261011-0041', src:'RTN-20261011-0198', tenant:'义乌恒发家居',
     sku:'SKU-71904', qty:1, act:'翻新', tag:'原标保留', owner:'王运营', status:'waitfix', wh:'EWR-02',
     note:'外包装破损，需更换新包装后重新上架。'},
    {id:'RL-20261011-0040', src:'RTN-20261011-0201', tenant:'深圳致远电子',
     sku:'SKU-88231', qty:24, act:'重新上架', tag:'A-03-12', owner:'陈工', status:'waitput', wh:'LAX-01',
     note:'目标库位 A-03-12，上架任务待推送 PDA。'},
    {id:'RL-20261011-0039', src:'RTN-20261011-0170', tenant:'中山灯饰照明',
     sku:'SKU-99310', qty:3, act:'翻新', tag:'原标保留', owner:'王运营', status:'waitput', wh:'BHX-03',
     note:'翻新已完成，待分配库位。'},
    {id:'RL-20261011-0038', src:'RTN-20261011-0192', tenant:'苏州明达玩具',
     sku:'SKU-11708', qty:36, act:'销毁', tag:'影像 36 张', owner:'刘主管', status:'waitdestroy', wh:'FRA-04',
     note:'残损不可售，销毁将拍照留档并生成销毁报告。'}
  ],

  /* ================= 货主 ================= */
  tenant: [
    {id:'TN-00041', name:'深圳致远电子', ch:'Amazon · Shopify', cur:'USD', tpl:'B2C 代发',
     policy:'混放', ar:'$32,480', status:'co', contact:'李敏', phone:'+86 755 8812 4471',
     since:'2023-08', whs:'LAX-01 · EWR-02', outM:'41.2 万件', term:'月结 30 天',
     note:'合作 3 年 2 个月，累计出库 41.2 万件，账期正常。'},
    {id:'TN-00058', name:'乐歌家居科技', ch:'Amazon · Walmart', cur:'USD', tpl:'B2B 大货',
     policy:'独占', ar:'$61,200', status:'co', contact:'张涛', phone:'+86 574 8812 3311',
     since:'2022-11', whs:'BHX-03 · FRA-04', outM:'18.6 万件', term:'月结 45 天',
     note:'大件 B2B 为主，含整托出库，占用托盘位较多。'},
    {id:'TN-00073', name:'安克创新科技', ch:'Amazon · eBay · Temu', cur:'USD', tpl:'混合',
     policy:'混放', ar:'$18,940', status:'co', contact:'周敏', phone:'+86 755 2233 8890',
     since:'2024-03', whs:'LAX-01', outM:'26.4 万件', term:'月结 30 天',
     note:'唯一使用序列号管理的货主，3C 高价值商品占比 62%。'},
    {id:'TN-00086', name:'义乌恒发家居', ch:'Temu 半托管', cur:'USD', tpl:'退货换标',
     policy:'混放', ar:'$9,860', status:'co', contact:'张成', phone:'+86 579 8663 1120',
     since:'2025-01', whs:'EWR-02', outM:'9.8 万件', term:'周结',
     note:'退货换标业务占比 34%，逆向毛利贡献显著。'},
    {id:'TN-00094', name:'宁波海诚日用', ch:'Shopify 独立站', cur:'USD', tpl:'B2C 代发',
     policy:'混放', ar:'$4,320', status:'renew', contact:'陈海', phone:'+86 574 8722 3390',
     since:'2024-09', whs:'LAX-01', outM:'4.2 万件', term:'月结 30 天',
     note:'协议将于 10-31 到期，逾期未续约将暂停收货与出库。'},
    {id:'TN-00102', name:'泉州鞋业外贸', ch:'eBay', cur:'USD', tpl:'B2C 代发',
     policy:'独占', ar:'$21,340', status:'paused', contact:'林芳', phone:'+86 595 2255 8814',
     since:'2023-05', whs:'EWR-02', outM:'12.1 万件', term:'月结 15 天',
     note:'账期逾期 45 天，已暂停收货与出库权限。'},
    {id:'TN-00115', name:'苏州明达玩具', ch:'Amazon · Temu', cur:'EUR', tpl:'混合',
     policy:'混放', ar:'$12,780', status:'co', contact:'吴晓', phone:'+86 512 6688 4402',
     since:'2024-06', whs:'FRA-04', outM:'7.6 万件', term:'月结 30 天',
     note:'库存占比高但动销低，呆滞库存占用 FRA-04 12 个库位。'},
    {id:'TN-00123', name:'中山灯饰照明', ch:'Shopify · eBay', cur:'GBP', tpl:'B2C 代发',
     policy:'混放', ar:'$7,450', status:'co', contact:'郑明', phone:'+86 760 2233 7719',
     since:'2025-04', whs:'BHX-03', outM:'5.3 万件', term:'月结 30 天',
     note:'欧线 VIES 已登记，BHX-03 出库可享受免税转运。'}
  ],

  /* ================= 账单 ================= */
  bill: [
    {id:'INV-202610-0041', tenant:'深圳致远电子', tenantId:'TN-00041', period:'2026-10',
     sys:'$32,480', conf:'$32,480', diff:'$0', diffCls:'', due:'11-30', status:'confirm',
     lines:214, cur:'USD', note:'明细 214 笔，待推送货主确认。'},
    {id:'INV-202610-0038', tenant:'乐歌家居科技', tenantId:'TN-00058', period:'2026-10',
     sys:'$61,200', conf:'$58,140', diff:'+$3,060', diffCls:'text-danger', due:'12-15', status:'diff',
     lines:96, cur:'USD', note:'货主少认 3,060 美元，主因托盘仓储天数计算口径差异。'},
    {id:'INV-202610-0035', tenant:'安克创新科技', tenantId:'TN-00073', period:'2026-10',
     sys:'$18,940', conf:'$18,940', diff:'$0', diffCls:'', due:'11-30', status:'topay',
     lines:480, cur:'USD', note:'账期剩余 19 天。'},
    {id:'INV-202610-0031', tenant:'义乌恒发家居', tenantId:'TN-00086', period:'2026-10 第 2 周',
     sys:'$9,860', conf:'$9,860', diff:'$0', diffCls:'', due:'10-18', status:'topay',
     lines:128, cur:'USD', note:'周结账单，10-18 到期。'},
    {id:'INV-202610-0028', tenant:'泉州鞋业外贸', tenantId:'TN-00102', period:'2026-09',
     sys:'$21,340', conf:'$21,340', diff:'$0', diffCls:'', due:'08-27', status:'overdue',
     lines:203, cur:'USD', note:'逾期 45 天，货主服务已暂停。'},
    {id:'INV-202610-0024', tenant:'苏州明达玩具', tenantId:'TN-00115', period:'2026-10',
     sys:'$12,780', conf:'—', diff:'待推送', diffCls:'text-muted', due:'11-30', status:'confirm',
     lines:76, cur:'EUR', note:'EUR 计价 €11,860，待推送货主。'}
  ],

  /* ================= PDA 任务 ================= */
  pda: [
    {id:'PT-20261011-0186', type:'上架', target:'A-03-12', qty:12, prio:'高',
     status:'doing', device:'PDA-03', doc:'ASN-20261011-0142', owner:'王大力',
     note:'上架任务已在 PDA-03 打开，进行中。'},
    {id:'PK-20261011-0442', type:'拣货', target:'C-11-04', qty:24, prio:'中',
     status:'todo', device:'—', doc:'OUT-20261011-3549', owner:'—',
     note:'波次 W-20261011-006 · 待领取。'},
    {id:'MV-20261011-0071', type:'移库', target:'B-07-21 → B-07-25', qty:36, prio:'中',
     status:'todo', device:'—', doc:'MV-20261011-0071', owner:'—',
     note:'拣货位溢出，需转移 36 件至 B-07-25。'},
    {id:'CT-20261011-0012', type:'盘点', target:'D 区 · 循环盘点', qty:'48 库位', prio:'低',
     status:'todo', device:'—', doc:'CN-20261011-014', owner:'—',
     note:'D 区循环盘点，48 个库位。'},
    {id:'RT-20261011-0088', type:'退件收货', target:'月台 D2', qty:6, prio:'高',
     status:'todo', device:'—', doc:'RTN-20261011-0186', owner:'—',
     note:'派送失败退回件 6 件，待月台收货。'}
  ],

  /* ================= 仓库 wh ================= */
  wh: [
    {
      id:'LAX-01', name:'美西洛杉矶仓', country:'美国', tz:'UTC-8 美西（PST/PDT）',
      cur:'USD', addr:'1420 E Slauson Ave, Los Angeles, CA 90011',
      locs:48620, docks:4, fill:78, tenants:8, zones:'A-F 共 6 区',
      status:'active', since:'2022-03', area:'12,000 ㎡',
      cap:'28,000 托盘位 · 限重 1,800 kg/位', cutoff:'17:00 UPS 末班截单',
      hrs:'周一至周六 08:00–20:00', holiday:'11-27 感恩节休',
      note:'主力仓，货权集中度最高的货主为深圳致远电子（34.8%），已接近 30% 集中度上限。'
    },
    {
      id:'EWR-02', name:'美东新泽港仓', country:'美国', tz:'UTC-5 美东（EST/EDT）',
      cur:'USD', addr:'100 Doremus Ave, Newark, NJ 07105',
      locs:31480, docks:3, fill:64, tenants:6, zones:'A-D 共 4 区',
      status:'active', since:'2023-06', area:'7,500 ㎡',
      cap:'16,000 托盘位 · 限重 1,500 kg/位', cutoff:'18:00 UPS 末班截单',
      hrs:'周一至周五 08:00–19:00', holiday:'—',
      note:'承接美西溢流，库容余量充足，建议作为 BHX-03 超限时的备选分流点。'
    },
    {
      id:'BHX-03', name:'英国伯明翰仓', country:'英国', tz:'UTC+0 英国（GMT/BST）',
      cur:'GBP', addr:'Unit 7, Minworth Industrial Estate, Birmingham B76 1BA',
      locs:18920, docks:2, fill:92, tenants:5, zones:'A-C 共 3 区',
      status:'active', since:'2023-11', area:'4,200 ㎡',
      cap:'9,500 托盘位 · 限重 1,200 kg/位', cutoff:'16:30 Royal Mail 截单',
      hrs:'周一至周五 09:00–18:00', holiday:'12-25 圣诞节休',
      note:'库容 91.6% 已超限并触发扩容预警；乐歌家居科技为独占货主，无法通过混放腾挪。'
    },
    {
      id:'FRA-04', name:'德国法兰克福仓', country:'德国', tz:'UTC+1 德国（CET/CEST）',
      cur:'EUR', addr:'Ludwig-Erhard-Str. 12, 60486 Frankfurt am Main',
      locs:12760, docks:2, fill:47, tenants:4, zones:'A-C 共 3 区',
      status:'active', since:'2024-04', area:'3,600 ㎡',
      cap:'7,800 托盘位 · 限重 1,200 kg/位', cutoff:'17:30 DHL 截单',
      hrs:'周一至周五 08:30–17:30', holiday:'05-01 劳动节休',
      note:'欧盟 IOSS 已登记，库容余量最大；苏州明达玩具备货集中于此。'
    },
    {
      id:'YYZ-05', name:'加拿大多伦多仓', country:'加拿大', tz:'UTC-5 东部（EST/EDT）',
      cur:'CAD', addr:'225 Fenmar Dr, North York, ON M9L 1C9',
      locs:0, docks:2, fill:0, tenants:0, zones:'待规划',
      status:'setup', since:'2026-10', area:'2,800 ㎡',
      cap:'6,000 托盘位 · 规划中', cutoff:'待定',
      hrs:'待定', holiday:'待定',
      note:'新建仓，尚未开通货主、未生成库位。需完成库区模板、货主授权与承运商交接配置后方可启用。'
    }
  ],

  /* ================= 库存流水 ledger =================
     唯一真相源：所有库存变化都必须由单据驱动写入本表，
     余额 = SUM(流水)，不允许直接改数字。 */
  ledger: [
    {
      id:'LG-20261011-00914', t:'10-11 14:26', wh:'LAX-01', tenant:'深圳致远电子',
      sku:'SKU-88231', name:'便携式榨汁杯 450ml', lot:'B2604-0912', loc:'A-03-12',
      qty:12, dir:'IN', from:'in_transit', to:'on_hand',
      docType:'ASN', doc:'ASN-20261011-0142', line:1,
      op:'陈工', device:'PDA-03', balance:142,
      note:'上架入位 12 件，计入深圳致远电子台账。'
    },
    {
      id:'LG-20261011-00913', t:'10-11 14:22', wh:'LAX-01', tenant:'深圳致远电子',
      sku:'SKU-88231', name:'便携式榨汁杯 450ml', lot:'B2604-0912', loc:'月台 D2',
      qty:12, dir:'IN', from:'in_transit', to:'in_dock',
      docType:'ASN', doc:'ASN-20261011-0142', line:1,
      op:'陈工', device:'PDA-03', balance:130,
      note:'扫码收货第 219 箱，箱子至月台 D2。'
    },
    {
      id:'LG-20261011-00896', t:'10-11 13:05', wh:'EWR-02', tenant:'义乌恒发家居',
      sku:'SKU-71904', name:'折叠收纳箱 66L 三件套', lot:'B2604-0908', loc:'C-11-04',
      qty:360, dir:'IN', from:'in_transit', to:'on_hand',
      docType:'ASN', doc:'ASN-20261011-0141', line:2,
      op:'王运营', device:'WEB', balance:8780,
      note:'空运到货整批上架，锁定库存另计。'
    },
    {
      id:'LG-20261011-00871', t:'10-11 11:48', wh:'LAX-01', tenant:'安克创新科技',
      sku:'SKU-88231', name:'便携式榨汁杯 450ml', lot:'B2604-0912', loc:'A-03-12',
      qty:24, dir:'OUT', from:'allocated', to:'picked',
      docType:'OUTBOUND', doc:'OUT-20261011-3572', line:1,
      op:'赵小雨', device:'PDA-05', balance:118,
      note:'波次 W-20261011-007 拣货 24 件，锁定转已拣。'
    },
    {
      id:'LG-20261011-00868', t:'10-11 11:40', wh:'LAX-01', tenant:'安克创新科技',
      sku:'SKU-88231', name:'便携式榨汁杯 450ml', lot:'B2604-0912', loc:'A-03-12',
      qty:24, dir:'OUT', from:'on_hand', to:'allocated',
      docType:'OUTBOUND', doc:'OUT-20261011-3572', line:1,
      op:'系统', device:'API', balance:142,
      note:'订单预占 24 件，预占有效期 30 分钟。'
    },
    {
      id:'LG-20261011-00842', t:'10-11 10:12', wh:'BHX-03', tenant:'东莞精工五金',
      sku:'SKU-56012', name:'LED 感应夜灯 磁吸款', lot:'B2603-0221', loc:'B-07-21',
      qty:36, dir:'OUT', from:'in_dock', to:'inspecting',
      docType:'RETURN', doc:'RTN-20261011-0181', line:1,
      op:'刘主管', device:'WEB', balance:0,
      note:'FBA 移除退件 12 件到货，另有 24 件在途。'
    },
    {
      id:'LG-20261011-00830', t:'10-11 09:58', wh:'FRA-04', tenant:'乐歌家居科技',
      sku:'SKU-33478', name:'不锈钢保温杯 500ml', lot:'B2604-0915', loc:'D-02-09',
      qty:88, dir:'IN', from:'on_hand', to:'quarantined',
      docType:'COUNT', doc:'CN-20261011-014', line:0,
      op:'系统', device:'WEB', balance:2140,
      note:'循环盘点快照锁定 88 件，盘点期间不可出库。'
    },
    {
      id:'LG-20261010-00724', t:'10-10 18:31', wh:'FRA-04', tenant:'苏州明达玩具',
      sku:'SKU-11708', name:'棉麻窗帘 200×270cm', lot:'B2511-0330', loc:'D-06-22',
      qty:148, dir:'OUT', from:'quarantined', to:'damaged',
      docType:'RETURN', doc:'RTN-20261011-0192', line:1,
      op:'王运营', device:'WEB', balance:1905,
      note:'质检定级 C 级残损 148 件，待货主确认处置。'
    },
    {
      id:'LG-20261010-00712', t:'10-10 16:05', wh:'EWR-02', tenant:'中山灯饰照明',
      sku:'SKU-99310', name:'瑜伽垫 TPE 加厚 8mm', lot:'B2603-0714', loc:'C-04-16',
      qty:60, dir:'OUT', from:'on_hand', to:'packed',
      docType:'OUTBOUND', doc:'OUT-20261011-3571', line:1,
      op:'钱大力', device:'PDA-08', balance:5770,
      note:'打包完成待交接，称重 3.2kg 与预估偏差 4%。'
    },
    {
      id:'LG-20261010-00705', t:'10-10 15:44', wh:'LAX-01', tenant:'深圳致远电子',
      sku:'SKU-44122', name:'蓝牙自拍杆 三脚架款', lot:'B2604-0930', loc:'A-01-04',
      qty:0, dir:'ADJ', from:'on_hand', to:'on_hand',
      docType:'ADJUST', doc:'ADJ-20261010-0031', line:1,
      op:'刘主管', device:'WEB', balance:62,
      note:'盘点差异调整 -2 件（少货），审批单 ADJ-20261010-0031 已通过。'
    }
  ]
};

/* ---- 状态字典 ---- */
WMS.STATUS = {
  /* asn */
  booked:      {cls:'b-wait', text:'待到货'},
  receiving:   {cls:'b-ing',  text:'收货中'},
  inspecting:  {cls:'b-wait', text:'待验收'},
  putaway:     {cls:'b-wait', text:'待上架'},
  done:        {cls:'b-done', text:'已完成'},
  error:       {cls:'b-err',  text:'验收异常'},
  /* sku */
  ok:          {cls:'b-done', text:'正常'},
  low:         {cls:'b-err',  text:'低库存'},
  oos:         {cls:'b-err',  text:'缺货'},
  lock:        {cls:'b-ing',  text:'锁定'},
  slow:        {cls:'b-wait', text:'呆滞'},
  /* out */
  waiting:     {cls:'b-wait', text:'待拣货'},
  picking:     {cls:'b-ing',  text:'拣货中'},
  topack:      {cls:'b-wait', text:'待打包'},
  ready:       {cls:'b-wait', text:'待发运'},
  handed:      {cls:'b-ing',  text:'已交接'},
  shipped:     {cls:'b-done', text:'已发运'},
  stalled:     {cls:'b-err',  text:'轨迹异常'},
  addrerr:     {cls:'b-err',  text:'地址异常'},
  /* loc */
  free:        {cls:'b-done', text:'空闲'},
  part:        {cls:'b-wait', text:'部分'},
  full:        {cls:'b-err',  text:'满载'},
  /* lock 状态复用 b-ing */
  /* rpt */
  pending:     {cls:'b-wait', text:'待更新'},
  failed:      {cls:'b-err',  text:'生成失败'},
  generating:  {cls:'b-ing',  text:'生成中'},
  /* usr */
  on:          {cls:'b-done', text:'启用'},
  off:         {cls:'b-err',  text:'停用'}
};
/* 库位的 lock 与库存的 lock 冲突，用命名空间区分 */
WMS.STATUS_BY = {
  loc:  {free:{cls:'b-done', text:'空闲'}, part:{cls:'b-wait', text:'部分占用'},
         full:{cls:'b-err',  text:'满载'}, lock:{cls:'b-ing',  text:'盘点锁定'}},
  rpt:  {ok:{cls:'b-done', text:'正常'}, pending:{cls:'b-wait', text:'待更新'},
         failed:{cls:'b-err', text:'生成失败'}, generating:{cls:'b-ing', text:'生成中'}},
  order:{assign:{cls:'b-wait', text:'待分仓'}, held:{cls:'b-done', text:'已预占'},
         block:{cls:'b-err',  text:'缺货拦截'}, sent:{cls:'b-done', text:'已下发'},
         returned:{cls:'b-neutral', text:'已退回'}},
  ret:  {arrive:{cls:'b-wait', text:'待到货'}, qc:{cls:'b-ing',  text:'质检中'},
         relabel:{cls:'b-wait', text:'待换标'}, refurb:{cls:'b-ing', text:'翻新中'},
         done:{cls:'b-done', text:'已完成'}, scrapped:{cls:'b-err', text:'待报废确认'}},
  retn: {printing:{cls:'b-ing',  text:'打印中'}, waitfix:{cls:'b-wait', text:'待换标'},
         doing:{cls:'b-ing',  text:'翻新中'}, waitput:{cls:'b-wait', text:'待上架'},
         waitdestroy:{cls:'b-err', text:'待销毁'}, done:{cls:'b-done', text:'已完成'}},
  tenant:{co:{cls:'b-done', text:'合作中'}, renew:{cls:'b-wait', text:'待续约'},
          paused:{cls:'b-err', text:'已暂停'}},
  bill: {confirm:{cls:'b-wait', text:'待确认'}, topay:{cls:'b-ing',  text:'待收款'},
         overdue:{cls:'b-err',  text:'逾期'}, diff:{cls:'b-err',  text:'差异'},
         recon:{cls:'b-ing',  text:'对账中'}, paid:{cls:'b-done', text:'已结清'}},
  pda:  {todo:{cls:'b-wait', text:'待领取'}, doing:{cls:'b-ing', text:'进行中'},
         done:{cls:'b-done', text:'已完成'}},
  wh:   {setup:{cls:'b-wait', text:'待启用'}, active:{cls:'b-done', text:'运营中'},
         hold:{cls:'b-err',  text:'已停用'}},
    ledger:{IN:{cls:'b-done', text:'入库'}, OUT:{cls:'b-err', text:'出库'},
            ADJ:{cls:'b-wait', text:'调整'}}
};
/* 各业务域的状态中文名（用于 Tab 计数、确认弹窗与操作反馈） */
WMS.STATUS_TEXT = {
  order:{assign:'待分仓', held:'已预占', block:'缺货拦截', sent:'已下发', returned:'已退回'},
  ret:{arrive:'待到货', qc:'质检中', relabel:'待换标', refurb:'翻新中', done:'已完成', scrapped:'待报废确认'},
  retn:{printing:'打印中', waitfix:'待换标', doing:'翻新中', waitput:'待上架', waitdestroy:'待销毁', done:'已完成'},
  tenant:{co:'合作中', renew:'待续约', paused:'已暂停'},
  bill:{confirm:'待确认', topay:'待收款', overdue:'逾期', diff:'差异', recon:'对账中', paid:'已结清'},
  pda:{todo:'待领取', doing:'进行中', done:'已完成'},
  asn:{booked:'待到货', receiving:'收货中', inspecting:'待验收', putaway:'待上架', done:'已完成', error:'验收异常'},
  out:{waiting:'待拣货', picking:'拣货中', topack:'待打包', ready:'待发运', handed:'已交接',
       shipped:'已发运', stalled:'轨迹异常', addrerr:'地址异常'},
  loc:{free:'空闲', part:'部分', full:'满载', lock:'锁定'},
  rpt:{ok:'正常', pending:'待更新', failed:'生成失败', generating:'生成中'},
  usr:{on:'启用', off:'停用'},
  sku:{ok:'正常', low:'低库存', oos:'缺货', lock:'锁定', slow:'呆滞'},
  ledger:{IN:'入库', OUT:'出库', ADJ:'调整'}
};
WMS.statusText = function (kind, key) {
  if (WMS.STATUS_BY[kind]) {
    var b = WMS.STATUS_BY[kind][key];
    if (b) return '<span class="badge ' + b.cls + '">' + b.text + '</span>';
    return '<span class="badge b-neutral">' + WMS.esc(key) + '</span>';
  }
  var map = WMS.STATUS;
  var s = map[key] || {cls:'b-neutral', text:key};
  return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
};
/* 状态中文名查询（Tab 计数 / 反馈文案用） */
WMS.statusTextOf = function (kind, key) {
  var m = WMS.STATUS_TEXT[kind];
  if (m && m[key]) return m[key];
  var s = WMS.STATUS[key];
  return s ? s.text : key;
};
