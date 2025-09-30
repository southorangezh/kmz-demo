const creationForm = document.getElementById('creationForm');
const missionForm = document.getElementById('missionForm');
const templateForm = document.getElementById('templateForm');
const waypointForm = document.getElementById('waypointForm');
const waypointTable = document.getElementById('waypointTable');
const creationNowBtn = document.getElementById('creationNow');
const waypointResetBtn = document.getElementById('waypointReset');
const downloadKMLBtn = document.getElementById('downloadKML');
const downloadKMZBtn = document.getElementById('downloadKMZ');
const creationStatus = document.getElementById('creationStatus');
const missionStatus = document.getElementById('missionStatus');
const templateStatus = document.getElementById('templateStatus');
const templatePreview = document.getElementById('templatePreview');
const waylinesPreview = document.getElementById('waylinesPreview');

const TEMPLATE_PREVIEW_PLACEHOLDER = '请填写表单以生成 template.kml 预览。';
const WAYLINES_PREVIEW_PLACEHOLDER = '请填写表单并添加航点以生成 waylines.wpml 预览。';

const state = {
  creation: {
    author: '',
    createTime: '',
    updateTime: '',
  },
  mission: {
    flyToWaylineMode: 'safely',
    finishAction: 'goHome',
    exitOnRCLost: 'goContinue',
    executeRCLostAction: 'hover',
    takeOffSecurityHeight: '',
    takeOffRefPoint: '',
    takeOffRefPointAGLHeight: '',
    globalTransitionalSpeed: '',
    globalRTHHeight: '',
    droneEnumValue: '',
    droneSubEnumValue: '',
    payloadEnumValue: '',
    payloadPositionIndex: '',
  },
  template: {
    templateType: 'waypoint',
    templateId: '',
    coordinateMode: 'WGS84',
    heightMode: 'EGM96',
    globalShootHeight: '',
    globalHeight: '',
    positioningType: 'GPS',
    surfaceFollowModeEnable: false,
    surfaceRelativeHeight: '',
    autoFlightSpeed: '',
    gimbalPitchMode: 'usePointSetting',
    waypointHeadingMode: 'followWayline',
    waypointHeadingAngle: '',
    waypointPoiPoint: '',
    waypointHeadingPathMode: 'clockwise',
    globalWaypointTurnMode: 'coordinateTurn',
    globalUseStraightLine: false,
    payloadParam: {
      payloadPositionIndex: '',
      focusMode: '',
      meteringMode: '',
      dewarpingEnable: '',
      returnMode: '',
      samplingRate: '',
      scanningMode: '',
      modelColoringEnable: '',
      imageFormat: '',
    },
  },
  waypoints: [],
};

let map;
let markersLayer;

initForms();
initMap();
renderWaypoints();
updateDownloadState();

function initForms() {
  setFormValues(creationForm, state.creation);
  setFormValues(missionForm, state.mission);
  setFormValues(templateForm, state.template);

  creationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(creationForm);
    state.creation.author = data.get('author').trim();
    state.creation.createTime = parseOptionalInteger(data.get('createTime'));
    state.creation.updateTime = parseOptionalInteger(data.get('updateTime'));
    updateStatus(creationStatus, '创建信息已保存');
    updateXMLPreview();
  });

  missionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(missionForm);
    state.mission.flyToWaylineMode = data.get('flyToWaylineMode');
    state.mission.finishAction = data.get('finishAction');
    state.mission.exitOnRCLost = data.get('exitOnRCLost');
    state.mission.executeRCLostAction = data.get('executeRCLostAction');
    state.mission.takeOffSecurityHeight = parseOptionalNumber(data.get('takeOffSecurityHeight'));
    state.mission.takeOffRefPoint = data.get('takeOffRefPoint').trim();
    state.mission.takeOffRefPointAGLHeight = parseOptionalNumber(data.get('takeOffRefPointAGLHeight'));
    state.mission.globalTransitionalSpeed = parseOptionalNumber(data.get('globalTransitionalSpeed'));
    state.mission.globalRTHHeight = parseOptionalNumber(data.get('globalRTHHeight'));
    state.mission.droneEnumValue = parseOptionalInteger(data.get('droneEnumValue'));
    state.mission.droneSubEnumValue = parseOptionalInteger(data.get('droneSubEnumValue'));
    state.mission.payloadEnumValue = parseOptionalInteger(data.get('payloadEnumValue'));
    state.mission.payloadPositionIndex = parseOptionalInteger(data.get('payloadPositionIndex'));
    updateStatus(missionStatus, '任务信息已保存');
    updateXMLPreview();
  });

  templateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(templateForm);
    state.template.templateType = data.get('templateType');
    state.template.templateId = parseOptionalInteger(data.get('templateId'));
    state.template.coordinateMode = data.get('coordinateMode');
    state.template.heightMode = data.get('heightMode');
    state.template.globalShootHeight = parseOptionalNumber(data.get('globalShootHeight'));
    state.template.globalHeight = parseOptionalNumber(data.get('globalHeight'));
    state.template.positioningType = data.get('positioningType');
    state.template.surfaceFollowModeEnable = data.get('surfaceFollowModeEnable') === 'on';
    state.template.surfaceRelativeHeight = parseOptionalNumber(data.get('surfaceRelativeHeight'));
    state.template.autoFlightSpeed = parseOptionalNumber(data.get('autoFlightSpeed'));
    state.template.gimbalPitchMode = data.get('gimbalPitchMode');
    state.template.waypointHeadingMode = data.get('waypointHeadingMode');
    state.template.waypointHeadingAngle = parseOptionalNumber(data.get('waypointHeadingAngle'));
    state.template.waypointPoiPoint = data.get('waypointPoiPoint').trim();
    state.template.waypointHeadingPathMode = data.get('waypointHeadingPathMode');
    state.template.globalWaypointTurnMode = data.get('globalWaypointTurnMode');
    state.template.globalUseStraightLine = data.get('globalUseStraightLine') === 'on';
    state.template.payloadParam.payloadPositionIndex = parseOptionalInteger(
      data.get('payloadParam.payloadPositionIndex'),
    );
    state.template.payloadParam.focusMode = data.get('payloadParam.focusMode') || '';
    state.template.payloadParam.meteringMode = data.get('payloadParam.meteringMode') || '';
    state.template.payloadParam.dewarpingEnable = data.get('payloadParam.dewarpingEnable') || '';
    state.template.payloadParam.returnMode = data.get('payloadParam.returnMode') || '';
    state.template.payloadParam.samplingRate = parseOptionalInteger(data.get('payloadParam.samplingRate'));
    state.template.payloadParam.scanningMode = data.get('payloadParam.scanningMode') || '';
    state.template.payloadParam.modelColoringEnable = data.get('payloadParam.modelColoringEnable') || '';
    state.template.payloadParam.imageFormat = (data.get('payloadParam.imageFormat') || '').trim();
    updateStatus(templateStatus, '模板信息已保存');
    updateXMLPreview();
  });

  waypointForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(waypointForm);
    const editIndexValue = formData.get('editIndex');
    const longitude = parseFloat(formData.get('longitude'));
    const latitude = parseFloat(formData.get('latitude'));

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      alert('请输入有效的经纬度');
      return;
    }

    const waypoint = {
      name: formData.get('name').trim() || '未命名航点',
      description: formData.get('description').trim(),
      longitude,
      latitude,
      coordinateAltitude: parseOptionalNumber(formData.get('coordinateAltitude')),
      ellipsoidHeight: parseOptionalNumber(formData.get('ellipsoidHeight')),
      height: parseOptionalNumber(formData.get('height')),
      gimbalPitchAngle: parseOptionalNumber(formData.get('gimbalPitchAngle')),
      useGlobalHeight: formData.get('useGlobalHeight') === 'on',
      useGlobalSpeed: formData.get('useGlobalSpeed') === 'on',
      useGlobalHeadingParam: formData.get('useGlobalHeadingParam') === 'on',
      useGlobalTurnParam: formData.get('useGlobalTurnParam') === 'on',
      waypointSpeed: parseOptionalNumber(formData.get('waypointSpeed')),
      waypointHeadingMode: formData.get('waypointHeadingMode'),
      waypointHeadingAngle: parseOptionalNumber(formData.get('waypointHeadingAngle')),
      waypointPoiPoint: (formData.get('waypointPoiPoint') || '').trim(),
      waypointHeadingPathMode: formData.get('waypointHeadingPathMode'),
      waypointTurnMode: formData.get('waypointTurnMode'),
      waypointTurnDampingDist: parseOptionalNumber(formData.get('waypointTurnDampingDist')),
      useStraightLine: formData.get('useStraightLine') === 'on',
      isRisky: formData.get('isRisky') === 'on',
    };

    const isEditing = editIndexValue !== null && editIndexValue !== '';
    if (isEditing) {
      state.waypoints[Number(editIndexValue)] = waypoint;
    } else {
      state.waypoints.push(waypoint);
    }

    renderWaypoints();
    renderMarkers();
    updateDownloadState();
    resetWaypointForm();
  });

  waypointResetBtn.addEventListener('click', () => {
    resetWaypointForm();
    waypointForm.querySelector('input[name="name"]').focus();
  });

  ['useGlobalHeight', 'useGlobalSpeed', 'useGlobalHeadingParam', 'useGlobalTurnParam'].forEach((name) => {
    const checkbox = waypointForm.elements[name];
    if (checkbox) {
      checkbox.addEventListener('change', updateWaypointFieldAvailability);
    }
  });

  creationNowBtn.addEventListener('click', () => {
    const now = Date.now();
    creationForm.querySelector('input[name="createTime"]').value = now;
    creationForm.querySelector('input[name="updateTime"]').value = now;
  });

  updateWaypointFieldAvailability();
}

function initMap() {
  map = L.map('map', {
    zoomControl: true,
  }).setView([39.9042, 116.4074], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 贡献者',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function renderWaypoints() {
  if (state.waypoints.length === 0) {
    waypointTable.innerHTML = '<tr class="empty-row"><td colspan="8">暂无航点，请使用上方表单逐项添加。</td></tr>';
    updateXMLPreview();
    return;
  }

  waypointTable.innerHTML = state.waypoints
    .map((waypoint, index) => {
      const inheritFlags = [
        waypoint.useGlobalHeight ? '高' : '',
        waypoint.useGlobalSpeed ? '速' : '',
        waypoint.useGlobalHeadingParam ? '偏' : '',
        waypoint.useGlobalTurnParam ? '转' : '',
      ]
        .filter(Boolean)
        .join('/');
      const badges = [];
      if (waypoint.useStraightLine) {
        badges.push('直线');
      }
      if (waypoint.isRisky) {
        badges.push('危险');
      }

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHTML(waypoint.name)}</td>
          <td>${waypoint.longitude.toFixed(6)}</td>
          <td>${waypoint.latitude.toFixed(6)}</td>
          <td>${formatOptionalNumber(waypoint.height)}</td>
          <td>${inheritFlags || '无'}</td>
          <td>${badges.length ? badges.join('/') : '无'}</td>
          <td>
            <button type="button" class="secondary" data-action="edit" data-index="${index}">编辑</button>
            <button type="button" data-action="delete" data-index="${index}">删除</button>
          </td>
        </tr>
      `;
    })
    .join('');

  waypointTable.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => handleWaypointRowAction(button.dataset));
  });

  updateXMLPreview();
}

function handleWaypointRowAction({ action, index }) {
  const waypoint = state.waypoints[Number(index)];
  if (!waypoint) return;

  if (action === 'edit') {
    setFormValues(waypointForm, {
      editIndex: index,
      ...waypoint,
    });
    updateWaypointFieldAvailability();
  }

  if (action === 'delete') {
    if (confirm(`确定删除航点“${waypoint.name}”吗？`)) {
      state.waypoints.splice(Number(index), 1);
      renderWaypoints();
      renderMarkers();
      updateDownloadState();
      resetWaypointForm();
    }
  }
}

function renderMarkers() {
  markersLayer.clearLayers();
  if (state.waypoints.length === 0) return;

  const bounds = [];
  state.waypoints.forEach((waypoint) => {
    const marker = L.marker([waypoint.latitude, waypoint.longitude]).bindPopup(
      `<strong>${escapeHTML(waypoint.name)}</strong><br/>${escapeHTML(waypoint.description || '无描述')}`,
    );
    marker.addTo(markersLayer);
    bounds.push([waypoint.latitude, waypoint.longitude]);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 12);
  } else {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}

function resetWaypointForm() {
  waypointForm.reset();
  waypointForm.querySelector('input[name="editIndex"]').value = '';
  ['useGlobalHeight', 'useGlobalSpeed', 'useGlobalHeadingParam', 'useGlobalTurnParam'].forEach((name) => {
    const field = waypointForm.elements[name];
    if (field) field.checked = true;
  });
  ['useStraightLine', 'isRisky'].forEach((name) => {
    const field = waypointForm.elements[name];
    if (field) field.checked = false;
  });
  updateWaypointFieldAvailability();
}

function updateDownloadState() {
  const disabled = state.waypoints.length === 0;
  downloadKMLBtn.disabled = disabled;
  downloadKMZBtn.disabled = disabled;
  downloadKMLBtn.classList.toggle('disabled', disabled);
  downloadKMZBtn.classList.toggle('disabled', disabled);
}

downloadKMLBtn.addEventListener('click', () => {
  const kml = generateKML();
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  triggerDownload('template.kml', blob);
});

downloadKMZBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  zip.file('template.kml', generateKML());
  zip.file('waylines.wpml', generateWaylines());
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload('template.kmz', blob);
});

function generateKML() {
  const creationXML = [
    optionalTag('wpml:author', state.creation.author),
    optionalTag('wpml:createTime', state.creation.createTime),
    optionalTag('wpml:updateTime', state.creation.updateTime),
  ]
    .filter(Boolean)
    .join('\n      ');

  const missionXML = createMissionXML();
  const payloadParamXML = createPayloadParamXML();

  const folderXML = [
    `<wpml:templateType>${state.template.templateType}</wpml:templateType>`,
    optionalTag('wpml:templateId', state.template.templateId),
    `<wpml:waylineCoordinateSysParam>\n        <wpml:coordinateMode>${state.template.coordinateMode}</wpml:coordinateMode>\n        <wpml:heightMode>${state.template.heightMode}</wpml:heightMode>\n        ${optionalTag('wpml:globalShootHeight', state.template.globalShootHeight, '        ')}\n        <wpml:positioningType>${state.template.positioningType}</wpml:positioningType>\n        <wpml:surfaceFollowModeEnable>${state.template.surfaceFollowModeEnable ? 1 : 0}</wpml:surfaceFollowModeEnable>\n        ${optionalTag('wpml:surfaceRelativeHeight', state.template.surfaceRelativeHeight, '        ')}\n      </wpml:waylineCoordinateSysParam>`,
    optionalTag('wpml:autoFlightSpeed', state.template.autoFlightSpeed),
    optionalTag('wpml:globalHeight', state.template.globalHeight),
    `<wpml:gimbalPitchMode>${state.template.gimbalPitchMode}</wpml:gimbalPitchMode>`,
    `<wpml:globalWaypointHeadingParam>\n        <wpml:waypointHeadingMode>${state.template.waypointHeadingMode}</wpml:waypointHeadingMode>\n        ${optionalTag('wpml:waypointHeadingAngle', state.template.waypointHeadingAngle, '        ')}\n        ${optionalTag('wpml:waypointPoiPoint', state.template.waypointPoiPoint, '        ')}\n        <wpml:waypointHeadingPathMode>${state.template.waypointHeadingPathMode}</wpml:waypointHeadingPathMode>\n      </wpml:globalWaypointHeadingParam>`,
    `<wpml:globalWaypointTurnMode>${state.template.globalWaypointTurnMode}</wpml:globalWaypointTurnMode>`,
    `<wpml:globalUseStraightLine>${state.template.globalUseStraightLine ? 1 : 0}</wpml:globalUseStraightLine>`,
    payloadParamXML,
    state.waypoints
      .map((waypoint, index) => {
        const coordinates = [waypoint.longitude, waypoint.latitude];
        if (Number.isFinite(waypoint.coordinateAltitude)) {
          coordinates.push(waypoint.coordinateAltitude);
        }
        const waypointSpeedXML = !waypoint.useGlobalSpeed
          ? optionalTag('wpml:waypointSpeed', waypoint.waypointSpeed, '        ')
          : '';
        const waypointHeadingParamXML = !waypoint.useGlobalHeadingParam
          ? `        <wpml:waypointHeadingParam>\n          <wpml:waypointHeadingMode>${waypoint.waypointHeadingMode}</wpml:waypointHeadingMode>\n          ${optionalTag('wpml:waypointHeadingAngle', waypoint.waypointHeadingAngle, '          ')}\n          ${optionalTag('wpml:waypointPoiPoint', waypoint.waypointPoiPoint, '          ')}\n          <wpml:waypointHeadingPathMode>${waypoint.waypointHeadingPathMode}</wpml:waypointHeadingPathMode>\n        </wpml:waypointHeadingParam>`
          : '';
        const waypointTurnParamXML = !waypoint.useGlobalTurnParam
          ? `        <wpml:waypointTurnParam>\n          <wpml:waypointTurnMode>${waypoint.waypointTurnMode}</wpml:waypointTurnMode>\n          ${optionalTag('wpml:waypointTurnDampingDist', waypoint.waypointTurnDampingDist, '          ')}\n        </wpml:waypointTurnParam>`
          : '';
        return `      <Placemark>\n        <name>${escapeXML(waypoint.name)}</name>\n        ${optionalTag('description', waypoint.description, '        ')}\n        <Point>\n          <coordinates>${coordinates.join(',')}</coordinates>\n        </Point>\n        <wpml:index>${index}</wpml:index>\n        ${optionalTag('wpml:ellipsoidHeight', waypoint.ellipsoidHeight, '        ')}\n        ${optionalTag('wpml:height', waypoint.height, '        ')}\n        <wpml:useGlobalHeight>${waypoint.useGlobalHeight ? 1 : 0}</wpml:useGlobalHeight>\n        <wpml:useGlobalSpeed>${waypoint.useGlobalSpeed ? 1 : 0}</wpml:useGlobalSpeed>\n        <wpml:useGlobalHeadingParam>${waypoint.useGlobalHeadingParam ? 1 : 0}</wpml:useGlobalHeadingParam>\n        <wpml:useGlobalTurnParam>${waypoint.useGlobalTurnParam ? 1 : 0}</wpml:useGlobalTurnParam>\n        ${waypointSpeedXML}\n        ${waypointHeadingParamXML}\n        ${waypointTurnParamXML}\n        <wpml:useStraightLine>${waypoint.useStraightLine ? 1 : 0}</wpml:useStraightLine>\n        <wpml:isRisky>${waypoint.isRisky ? 1 : 0}</wpml:isRisky>\n        ${optionalTag('wpml:gimbalPitchAngle', waypoint.gimbalPitchAngle, '        ')}\n      </Placemark>`;
      })
      .join('\n'),
  ]
    .filter(Boolean)
    .join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    ${creationXML}
    <wpml:missionConfig>
      ${missionXML}
    </wpml:missionConfig>
    <Folder>
      ${folderXML}
    </Folder>
  </Document>
</kml>`;
}

function createMissionXML(indent = '      ') {
  const missionLines = [
    `${indent}<wpml:flyToWaylineMode>${state.mission.flyToWaylineMode}</wpml:flyToWaylineMode>`,
    `${indent}<wpml:finishAction>${state.mission.finishAction}</wpml:finishAction>`,
    `${indent}<wpml:exitOnRCLost>${state.mission.exitOnRCLost}</wpml:exitOnRCLost>`,
    `${indent}<wpml:executeRCLostAction>${state.mission.executeRCLostAction}</wpml:executeRCLostAction>`,
  ];

  [
    optionalTag('wpml:takeOffSecurityHeight', state.mission.takeOffSecurityHeight, indent),
    optionalTag('wpml:takeOffRefPoint', state.mission.takeOffRefPoint, indent),
    optionalTag('wpml:takeOffRefPointAGLHeight', state.mission.takeOffRefPointAGLHeight, indent),
    optionalTag('wpml:globalTransitionalSpeed', state.mission.globalTransitionalSpeed, indent),
    optionalTag('wpml:globalRTHHeight', state.mission.globalRTHHeight, indent),
  ]
    .filter(Boolean)
    .forEach((line) => missionLines.push(line));

  if (state.mission.droneEnumValue !== '') {
    const innerIndent = `${indent}  `;
    const droneLines = [
      `${indent}<wpml:droneInfo>`,
      `${innerIndent}<wpml:droneEnumValue>${state.mission.droneEnumValue}</wpml:droneEnumValue>`,
    ];
    const droneSub = optionalTag('wpml:droneSubEnumValue', state.mission.droneSubEnumValue, innerIndent);
    if (droneSub) {
      droneLines.push(droneSub);
    }
    droneLines.push(`${indent}</wpml:droneInfo>`);
    missionLines.push(droneLines.join('\n'));
  }

  if (state.mission.payloadEnumValue !== '') {
    const innerIndent = `${indent}  `;
    const payloadLines = [
      `${indent}<wpml:payloadInfo>`,
      `${innerIndent}<wpml:payloadEnumValue>${state.mission.payloadEnumValue}</wpml:payloadEnumValue>`,
    ];
    const payloadIndex = optionalTag('wpml:payloadPositionIndex', state.mission.payloadPositionIndex, innerIndent);
    if (payloadIndex) {
      payloadLines.push(payloadIndex);
    }
    payloadLines.push(`${indent}</wpml:payloadInfo>`);
    missionLines.push(payloadLines.join('\n'));
  }

  return missionLines.join('\n');
}

function createPayloadParamXML(indent = '      ') {
  const payloadParam = state.template.payloadParam;
  const innerIndent = `${indent}  `;
  const payloadLines = [
    optionalTag('wpml:payloadPositionIndex', payloadParam.payloadPositionIndex, innerIndent),
    optionalTag('wpml:focusMode', payloadParam.focusMode, innerIndent),
    optionalTag('wpml:meteringMode', payloadParam.meteringMode, innerIndent),
    optionalTag('wpml:dewarpingEnable', payloadParam.dewarpingEnable, innerIndent),
    optionalTag('wpml:returnMode', payloadParam.returnMode, innerIndent),
    optionalTag('wpml:samplingRate', payloadParam.samplingRate, innerIndent),
    optionalTag('wpml:scanningMode', payloadParam.scanningMode, innerIndent),
    optionalTag('wpml:modelColoringEnable', payloadParam.modelColoringEnable, innerIndent),
    optionalTag('wpml:imageFormat', payloadParam.imageFormat, innerIndent),
  ].filter(Boolean);

  if (payloadLines.length === 0) {
    return '';
  }

  return [`${indent}<wpml:payloadParam>`, ...payloadLines, `${indent}</wpml:payloadParam>`].join('\n');
}

function createHeadingParamXML(source, indent = '        ') {
  if (!source || !source.waypointHeadingMode) {
    return '';
  }

  const headingLines = [
    `${indent}<wpml:waypointHeadingParam>`,
    `${indent}  <wpml:waypointHeadingMode>${source.waypointHeadingMode}</wpml:waypointHeadingMode>`,
  ];

  const angleLine = optionalTag('wpml:waypointHeadingAngle', source.waypointHeadingAngle, `${indent}  `);
  if (angleLine) headingLines.push(angleLine);
  const poiLine = optionalTag('wpml:waypointPoiPoint', source.waypointPoiPoint, `${indent}  `);
  if (poiLine) headingLines.push(poiLine);
  if (source.waypointHeadingPathMode) {
    headingLines.push(
      `${indent}  <wpml:waypointHeadingPathMode>${source.waypointHeadingPathMode}</wpml:waypointHeadingPathMode>`,
    );
  }

  headingLines.push(`${indent}</wpml:waypointHeadingParam>`);
  return headingLines.join('\n');
}

function createTurnParamXML(source, indent = '        ') {
  if (!source || !source.waypointTurnMode) {
    return '';
  }

  const turnLines = [
    `${indent}<wpml:waypointTurnParam>`,
    `${indent}  <wpml:waypointTurnMode>${source.waypointTurnMode}</wpml:waypointTurnMode>`,
  ];

  const dampingLine = optionalTag('wpml:waypointTurnDampingDist', source.waypointTurnDampingDist, `${indent}  `);
  if (dampingLine) {
    turnLines.push(dampingLine);
  }

  turnLines.push(`${indent}</wpml:waypointTurnParam>`);
  return turnLines.join('\n');
}

function resolveExecuteHeightMode() {
  if (state.template.surfaceFollowModeEnable) {
    return 'realTimeFollowSurface';
  }
  if (state.template.heightMode === 'WGS84') {
    return 'WGS84';
  }
  return 'relativeToStartPoint';
}

function generateWaylines() {
  const missionXML = createMissionXML();
  const payloadParamXML = createPayloadParamXML();
  const waylineId = state.template.templateId === '' ? 0 : state.template.templateId;

  const folderXML = [
    optionalTag('wpml:templateId', state.template.templateId),
    `<wpml:waylineId>${waylineId}</wpml:waylineId>`,
    `<wpml:executeHeightMode>${resolveExecuteHeightMode()}</wpml:executeHeightMode>`,
    optionalTag('wpml:autoFlightSpeed', state.template.autoFlightSpeed),
    payloadParamXML,
    state.waypoints
      .map((waypoint, index) => {
        const coordinates = [waypoint.longitude, waypoint.latitude];
        if (Number.isFinite(waypoint.coordinateAltitude)) {
          coordinates.push(waypoint.coordinateAltitude);
        }

        const executeHeight = waypoint.useGlobalHeight ? state.template.globalHeight : waypoint.height;
        const waypointSpeed = waypoint.useGlobalSpeed ? state.template.autoFlightSpeed : waypoint.waypointSpeed;
        const headingSource = waypoint.useGlobalHeadingParam
          ? {
              waypointHeadingMode: state.template.waypointHeadingMode,
              waypointHeadingAngle: state.template.waypointHeadingAngle,
              waypointPoiPoint: state.template.waypointPoiPoint,
              waypointHeadingPathMode: state.template.waypointHeadingPathMode,
            }
          : waypoint;
        const turnSource = waypoint.useGlobalTurnParam
          ? {
              waypointTurnMode: state.template.globalWaypointTurnMode,
              waypointTurnDampingDist: '',
            }
          : waypoint;
        const useStraightLineValue = waypoint.useGlobalTurnParam
          ? state.template.globalUseStraightLine
          : waypoint.useStraightLine;

        const headingParamXML = createHeadingParamXML(headingSource, '        ');
        const turnParamXML = createTurnParamXML(turnSource, '        ');

        const lines = [
          '      <Placemark>',
          `        <name>${escapeXML(waypoint.name)}</name>`,
          optionalTag('description', waypoint.description, '        '),
          '        <Point>',
          `          <coordinates>${coordinates.join(',')}</coordinates>`,
          '        </Point>',
          `        <wpml:index>${index}</wpml:index>`,
        ];

        const ellipsoidLine = optionalTag('wpml:ellipsoidHeight', waypoint.ellipsoidHeight, '        ');
        if (ellipsoidLine) lines.push(ellipsoidLine);

        const executeHeightLine = optionalTag('wpml:executeHeight', executeHeight, '        ');
        if (executeHeightLine) lines.push(executeHeightLine);

        const speedLine = optionalTag('wpml:waypointSpeed', waypointSpeed, '        ');
        if (speedLine) lines.push(speedLine);

        if (headingParamXML) lines.push(headingParamXML);
        if (turnParamXML) lines.push(turnParamXML);

        lines.push(`        <wpml:useStraightLine>${useStraightLineValue ? 1 : 0}</wpml:useStraightLine>`);
        lines.push(`        <wpml:isRisky>${waypoint.isRisky ? 1 : 0}</wpml:isRisky>`);

        const gimbalLine = optionalTag('wpml:gimbalPitchAngle', waypoint.gimbalPitchAngle, '        ');
        if (gimbalLine) lines.push(gimbalLine);

        lines.push('      </Placemark>');
        return lines.filter(Boolean).join('\n');
      })
      .join('\n'),
  ]
    .filter(Boolean)
    .join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    <wpml:missionConfig>
      ${missionXML}
    </wpml:missionConfig>
    <Folder>
      ${folderXML}
    </Folder>
  </Document>
</kml>`;
}

function updateXMLPreview() {
  if (!templatePreview || !waylinesPreview) {
    return;
  }

  const templateXML = generateKML().trim();
  templatePreview.textContent = templateXML || TEMPLATE_PREVIEW_PLACEHOLDER;

  if (state.waypoints.length === 0) {
    waylinesPreview.textContent = WAYLINES_PREVIEW_PLACEHOLDER;
    return;
  }

  const waylinesXML = generateWaylines().trim();
  waylinesPreview.textContent = waylinesXML || WAYLINES_PREVIEW_PLACEHOLDER;
}

function optionalTag(tagName, value, indent = '      ') {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return `${indent}<${tagName}>${escapeXML(value)}</${tagName}>`;
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function setFormValues(form, values) {
  setFormValuesWithPrefix(form, values, '');
}

function setFormValuesWithPrefix(form, values, prefix) {
  Object.entries(values).forEach(([name, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      setFormValuesWithPrefix(form, value, `${prefix}${name}.`);
      return;
    }

    const field = form.querySelector(`[name="${prefix}${name}"]`);
    if (!field) return;

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? '';
    }
  });
}

function parseOptionalNumber(value) {
  const text = `${value ?? ''}`.trim();
  if (text === '') return '';
  const number = Number.parseFloat(text);
  return Number.isFinite(number) ? number : '';
}

function parseOptionalInteger(value) {
  const text = `${value ?? ''}`.trim();
  if (text === '') return '';
  const number = Number.parseInt(text, 10);
  return Number.isInteger(number) ? number : '';
}

function updateStatus(element, message) {
  const time = new Date().toLocaleTimeString();
  element.textContent = `${message}（${time}）`;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXML(value) {
  return escapeHTML(value);
}

function formatOptionalNumber(value) {
  return value === '' || value === null || value === undefined ? '-' : Number(value).toFixed(2);
}

function updateWaypointFieldAvailability() {
  const useGlobalHeight = waypointForm.elements.useGlobalHeight?.checked;
  toggleFieldAvailability(waypointForm.elements.ellipsoidHeight, Boolean(useGlobalHeight));
  toggleFieldAvailability(waypointForm.elements.height, Boolean(useGlobalHeight));

  const useGlobalSpeed = waypointForm.elements.useGlobalSpeed?.checked;
  toggleFieldAvailability(waypointForm.elements.waypointSpeed, Boolean(useGlobalSpeed));

  const useGlobalHeadingParam = waypointForm.elements.useGlobalHeadingParam?.checked;
  ['waypointHeadingMode', 'waypointHeadingAngle', 'waypointPoiPoint', 'waypointHeadingPathMode'].forEach((name) => {
    toggleFieldAvailability(waypointForm.elements[name], Boolean(useGlobalHeadingParam));
  });

  const useGlobalTurnParam = waypointForm.elements.useGlobalTurnParam?.checked;
  ['waypointTurnMode', 'waypointTurnDampingDist'].forEach((name) => {
    toggleFieldAvailability(waypointForm.elements[name], Boolean(useGlobalTurnParam));
  });
  toggleFieldAvailability(waypointForm.elements.useStraightLine, Boolean(useGlobalTurnParam));
}

function toggleFieldAvailability(field, disabled) {
  if (!field) return;
  field.disabled = disabled;
  const label = field.closest('label');
  if (label) {
    label.classList.toggle('field-disabled', disabled);
  }
}
