const awsTranscribeServer = "https://my-tour-clips-transcriptions.s3.amazonaws.com/";
const awsServer = "https://review.addyourtour.com/";
const imgServer = "https://thumbnails-420.s3.amazonaws.com/";
const apiServer = "https://list.addyourtour.com/";
const langServer = "https://langs.addyourtour.com/";
mapboxgl.accessToken = "pk.eyJ1Ijoid3d3bWFzdGVyMSIsImEiOiJjazZmbmxhYngwYjQxM2xtdDdwMjJzYjdnIn0._QtAdUTg9NtC9_R8Caq6Ng";
let nameKey = null;
let map = null;
let wavesurfer = null;
let clipsurfer = null;
let tourCoordinates = [];
let audioFile = null;
let tourJson2 = null;
let marker = null;
let photoMarkers = [];
let currentTime = 0;
let tourClips = [];
let convertedStart = 0;
let convertedEnd = 0;
let clippedCoordinates = [];
let marker1 = null;
let selectedGalleryImages = { 'image_type': '', 'src': '', 'img_id': '' };
let selectedGalleryImagesOld = "";
let userClipped = false;
let tourMarkers = {};
let userClickedOnAudio = false;

let clippedGeometry = {
	id: "clipLine",
	type: "Feature",
	properties: { isNew: true, index: -1 },
	geometry: {
		type: "LineString",
		coordinates: [],
	},
};

// let DEVICES = document.getElementById("devices");
Plotly.newPlot('devices', [{
	x: [],
	y: [],
	mode: 'lines',
	type: 'scatter'
}]);

function resize() {
	$('#main-div').css('maxHeight', $(window).height() - 190);
}

$(window).resize(resize);
resize();
appStart();
var newClipPhotos = {};
var tourNames = JSON.parse(getCookie("tour_names"));
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";domain=.addyourtour.com;";
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
async function login() {
	if (!window.ethereum) {

		notifier.warning('MetaMask not detected. Please install MetaMask first.');
		return;
	} else {
		const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
		setCookie('public_key', accounts[0], 0.1);
		notifier.success("Logged-in successfully");
		checkLogin();
	}
}

checkLogin();
function checkLogin() {
	var userEth = getCookie('public_key');
	console.log("userEth", userEth);
	if (userEth !== "") {
		$('#login-btn').fadeOut();
		if (tourJson2 !== null) {
			if (tourJson2.METADATA.USER_ETHWALLET === userEth || tourJson2.METADATA.USER_ETHWALLET === "" || tourJson2.METADATA.USER_ETHWALLET === null) {
				$('#nachotour').fadeOut();
				$('#loggedin').fadeIn();
			} else {
				$('#loggedin').fadeOut();
				$('#nachotour').fadeIn();
			}
		}
		//else {
		//    $('#loggedin').fadeOut();
		//}
	} else {
		$('#login-btn').fadeIn();
		$('#loggedin').fadeOut();
	}
}
function addClip() {
	let clip = { IS_FOR_REVIEW: $('#review-check')[0].checked };
	console.log("new saving before clip", clippedGeometry);
	console.log("new saving after clip", clippedGeometry);
	var stEl = clippedGeometry.properties.isNew ? "startdate" : "startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "enddate" : "enddate" + clippedGeometry.properties.index;
	const st = document.getElementById(stEl).value;
	convertedStart = convert_time_to_seconds(st);
	const et = document.getElementById(enEl).value;
	convertedEnd = convert_time_to_seconds(et);
	clipGeometry();
	if (!convertedEnd) convertedEnd = parseInt(wavesurfer.getDuration());

	console.log("time", convertedStart, convertedEnd);
	console.log("tourJson new saving", tourJson2.CLIPS);

	clip.START = convertedStart;
	clip.END = convertedEnd;
	clip.CLIP_NAME = document.getElementById("clip_name").value;
	var allClipNames = tourJson2.CLIPS.map(c => c.CLIP_NAME);
	if (allClipNames.indexOf(clip.CLIP_NAME) !== -1) {
		notifier.warning("Clip name already exists");
		return;
	}
	clip.CLIP_FILE = "";
	clip.CLIP_PHOTO = "";
	if (clip.CLIP_NAME == null || clip.CLIP_NAME == '') {
		notifier.warning("Clip name is required");
		return;
	}

	let clipPathGeom = { ...clippedGeometry.geometry }
	if (clipPathGeom.coordinates.length === 0) {
		notifier.warning("Clip geometry is not ready. Click on the CLIP button");
		return;
	}
	if (selectedGalleryImages.image_type !== '') {
		var srcSpl = selectedGalleryImages.src.split('/')
		clip.CLIP_PHOTO = srcSpl[srcSpl.length - 1];
		let latLong = clippedGeometry.geometry.coordinates[0];
		if (selectedGalleryImages.image_type === 'new') {
			newClipPhotos[clip.CLIP_PHOTO] = selectedGalleryImages.src;
			tourJson2.PHOTOS.push({
				COORDINATES: {
					ELEV: 0,
					HEADING: 0,
					LAT: latLong[1],
					LONG: latLong[0]
				},
				FILE: clip.CLIP_PHOTO,
				TIMESTAMP: convertedEnd
			});
		}
	}
	// let geometry = clippedGeometry.geometry 
	//clip.CLIP_PATH = {...clippedGeometry.geometry}
	clip.CLIP_PATH = clipPathGeom;

	clip.TRANSCRIPTION = "";
	tourJson2.CLIPS.push({ ...clip });
	success();
	$('#add-clip-btn').click();
	userClipped = false;
}


function copyJsonToClipboard() {
	if (clippedGeometry.geometry.coordinates.length > 0) {
		navigator.clipboard.writeText('{"type": "FeatureCollection","features": [' + JSON.stringify(clippedGeometry) + ']}');
		notifier.success("Clip GeoJSON copied to clipboard.");
	}
	else {
		notifier.warning("Empty geometry. Nothing to copy.");
	}

}

function copyMapCenter() {
	if (map) {
		const { lng, lat } = map.getCenter();
		navigator.clipboard.writeText(JSON.stringify({ lat: lat, lng: lng }));
		notifier.success("Copied Map center coordinates.");
	}
}

function removeTour() {
	if (confirm("Are you sure you want to remove this tour from your portfolio?")) {
		delete tourNames[nameKey];
		setCookie("tour_names", JSON.stringify(tourNames), 10);
		currentSelect = document.getElementById("tourSelect")
		currentOption = currentSelect.selectedIndex;
		currentSelect.options[currentOption].remove();
		currentSelect.options[currentOption].selected = "true";
		if ("createEvent" in document) {
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("change", false, true);
			currentSelect.dispatchEvent(evt);
		} else currentSelect.fireEvent("onchange");
	}
}

function saveChanges(withLogin = true) {
	if (getCookie('public_key') === "" && withLogin) {
		checkLogin();
		notifier.warning("You are not logged in.");
		return;
	}
	if (withLogin) {
		tourJson2.METADATA.USER_ETHWALLET = getCookie('public_key');
	}
	$.ajax({
		url: 'https://osogs7whzhfw4rtkogwk24dka40cuqjd.lambda-url.us-east-1.on.aws/',
		method: 'post',
		crossDomain: true,
		data: JSON.stringify({
			json2_file_name: nameKey,
			photos: newClipPhotos,
			json2: tourJson2
		}),
		dataType: 'json',
		contentType: "application/json",
		success: function (results) {
			if ((results.message == "DONE") && withLogin) {
				notifier.success("Successfully saved changes.");
			}
		},
		error: function (error) {
			if (withLogin) {
				notifier.warning("Failed to save changes.")
			}
		}
	})
}

function clearClipGeometry() {
	// clippedGeometry.geometry.coordinates = [];
	// clippedGeometry.properties.isNew = true;
	// clippedGeometry.properties.index = -1;
	try {
		Draw.deleteAll();
	} catch (e) {
	}
}

function clearSelectedImages() {
	selectedGalleryImages = { 'image_type': '', 'src': '', 'img_id': '' };
}

async function fetchClipTranscription(filename) {
	const response = await fetch(`${awsTranscribeServer}${filename}`, { cache: "no-cache" });
	if (response.ok) {
		const transcription = await response.json();
		return transcription;
	} else {
		return "";
	}
}

const closeAccordion = () => {
	wavesurfer.clearRegions();
	console.log("accordion case 1");
	clearClipGeometry();
	$("#add-clip-btn").prop("disabled", false);
	var currentTourMp3 = `${awsServer}${nameKey}.mp3`;
	// If there was a clipped audio in player
	if (audioFile !== currentTourMp3) {
		//audioFile = currentTourMp3;
		//wavesurfer.load(audioFile);
		$("#playPauseIcon").removeClass("fa-pause").addClass("fa-play");
		$("#noOfSeconds").html(Math.round(wavesurfer.getDuration()));
		$("#fullAudioTime").html(new Date(Math.round(wavesurfer.getDuration()) * 1000).toISOString().substr(11, 8));

	}
	$("#numOfPointsTxt").show();
	$("#waveclip").hide();
	$("#waveform").show();
}

const updateDevicesData = () => {
	var timeData = tourCoordinates.map(feature => {
		return feature.properties.time;
	});
	const deviceDict = {};
	tourCoordinates.forEach(feature => {
		if (feature.devices) {
			feature.devices.forEach(device => {
				const deviceId = `${device.uuid}-${device.major}-${device.minor}`;
				const signal = device.signal;
				const time = feature.properties.time;
				if (deviceDict[deviceId]) {
					deviceDict[deviceId].x.push(time);
					deviceDict[deviceId].y.push(signal);
				} else {
					deviceDict[deviceId] = { x: [time], y: [signal] };
				}
			});
		}
	});
	const newData = Object.keys(deviceDict).map(deviceId => {
		const { x, y } = deviceDict[deviceId];
		timeData.forEach(time => {
			if (!x.includes(time)) {
				x.push(time);
				y.push(null);
			}
		})
		return ({
			x: deviceDict[deviceId].x,
			y: deviceDict[deviceId].y,
			mode: 'lines',
			type: 'scatter',
			name: deviceId
		});
	});
	// const waveform = $('#waveform').position();
	// $('#devices').css({
	// 	"margin-left": waveform.left,
	// 	"margin-right": waveform.right
	// })

	const playerWidth = window.innerWidth / 10;
	const graph_x = 79.5;
	const margin_x = playerWidth - graph_x;

	const layout = {
		title: "Signals of each device",
		width: $('#waveform').width() + 160,
		legend: {
			x: 0.2,
			y: -0.5
		}
	}
	Plotly.newPlot('devices', newData, layout);
	$('.main-svg').offset({ left: margin_x });
}

async function appStart() {
	if (getCookie("tour_names") === "") {
		setCookie("tour_names", JSON.stringify({}), 10);
	}
	const appUrl = window.location.href;
	let urlParams = appUrl.split("#");
	if (urlParams.length > 0) {
		nameKey = urlParams[1];
	}

	initWaveSurfer();

	const tours = await fetchTours();
	const features = tours.map((tour) => {
		const meta = tour.name.split('_');
		const coordinates = [meta[3], meta[2]];
		const feature = {
			type: "Feature",
			properties: {
				time: `${meta[0]} ${meta[1]}`,
				name: tour.name
			},
			geometry: {
				type: "Point",
				coordinates: coordinates
			}
		}
		return feature;
	});
	const collection = {
		type: "FeatureCollection",
		features: features
	}

	initMap(collection);

	// add dropdown options for selecting tour data
	const tourSelectElement = document.getElementById("tourSelect");
	tours.forEach((tour) => {
		var opt = document.createElement("option");
		opt.value = tour.name;
		opt.innerHTML = tour.name;
		if (tourNames.hasOwnProperty(tour.name)) {
			opt.innerHTML = tourNames[tour.name];
		}
		if (tour.name) {
			tourSelectElement.appendChild(opt);
		}
	});
	if (nameKey) {
		tourSelectElement.value = nameKey;
	} else {
		nameKey = tours[0].name;
		tourSelectElement.value = nameKey;
	}


	// if (map.isSourceLoaded("route")) {
	//     updateTourData(nameKey);
	// } else {
	//
	// }

	const Languages = await fetchLanguages();
	// add dropdown options for selecting language data
	const LanguageselectElement = document.getElementById("languageSelect");
	Languages.forEach((language) => {
		var opt = document.createElement("option");
		opt.value = language.id;
		opt.innerHTML = language.Language;
		if (language.Language) {
			LanguageselectElement.appendChild(opt);
		}
	});



	$("#tourSelect").on("change", async function (event) {
		console.log("tour changing");
		//nameKey = this.options[this.selectedIndex].value;
		nameKey = event.target.value;
		await updateTourData(nameKey);
		updateDevicesData();
	});


	$("#clip_edit").on("click", async function (event) {
		$("#clip_edit").addClass("active");
		editform();
	});

	$(document).ready(function () {
		$('#carouselExampleIndicators').on('slid.bs.carousel', function (e) {
			if (!userClickedOnAudio) {
				userClickedOnAudio = false;
				// transition by user click
				var newIndex = $(e.relatedTarget).index();
				console.log('New slide index is: ' + newIndex);
				console.log("new timestamp", tourJson2.PHOTOS[newIndex].TIMESTAMP);
				wavesurfer.play(tourJson2.PHOTOS[newIndex].TIMESTAMP);
			}
		});
		$("#toggleBtn").click(function () {
			console.log("toggle button clicked");
			console.log("tourCoordinates", tourCoordinates);
			if ($("#toggleBtn").text().trim() == "Devices View") {
				updateDevicesData();
				$("#main-div").fadeOut("slow");
				$("#map").fadeOut("slow", function () {
					$("#map").hide();
					$("#devices").fadeIn("slow");
					$("#toggleBtn").text("Location View");
				});
			}
			if ($("#toggleBtn").text().trim() == "Location View") {
				$("#devices").fadeOut("slow", function () {
					$("#main-div").fadeIn("slow");
					$("#devices").hide();
					$("#map").fadeIn("slow");
					$("#toggleBtn").text("Devices View");
				})
			}
		});
	});

	// Accordion is closed or opened...	
	$(document).on("click", ".accordion-button", async function (e) {
		//If closed
		console.log(e);
		var target = e.currentTarget;
		console.log("accordion clicked", target);
		if (target.className.indexOf('collapsed') !== -1) {
			closeAccordion();
			return;
		} else {
			$("#numOfPointsTxt").hide();
		}

		console.log("accordion case 2");
		console.log("tourJson2", tourJson2);
		let name = target.innerText;
		console.log("accordion button inner", name);
		var isTourHasNewTxt = false;
		for (let i = 0; i < tourJson2.CLIPS.length; i++) {
			if (tourJson2.CLIPS[i].CLIP_NAME == name) {
				clippedGeometry.geometry = { ...tourJson2.CLIPS[i].CLIP_PATH };
				clippedGeometry.properties.isNew = false;
				clippedGeometry.properties.index = i;
				convertedStart = tourJson2.CLIPS[i].START;
				convertedEnd = tourJson2.CLIPS[i].END;
				updateRegionFromClip(convertedStart, convertedEnd);
				addFeatureToEdit(clippedGeometry);
				if (tourJson2.CLIPS[i].CLIP_FILE.indexOf(".mp3") !== -1) {
					audioFile = `${awsServer}${tourJson2.CLIPS[i].CLIP_FILE}`;
					$("#waveform").hide();
					$("#waveclip").show();
					clipsurfer.load(audioFile);
					if (tourJson2.CLIPS[i].TRANSCRIPTION === "") {
						var transcription = await fetchClipTranscription(tourJson2.CLIPS[i].CLIP_FILE + ".txt");
						try {
							transcription = transcription.results.transcripts.map(tr => tr.transcript);
							$('#clip-transcription-' + i).text(transcription.join("<br>"));
							tourJson2.CLIPS[i].TRANSCRIPTION = transcription.join("<br>");
							isTourHasNewTxt = true;
						} catch (e) {
							$('#clip-transcription-' + i).text("Transcription is still in progress...");
						}
					} else {
						$('#clip-transcription-' + i).text(tourJson2.CLIPS[i].TRANSCRIPTION);
					}

				}
				try {
					var bb = turf.bbox(clippedGeometry);
					map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 50 });
				} catch (e) {

				}
				break;
			}
		}
		if (isTourHasNewTxt) {
			saveChanges(false);
		}

	});

	$("#add-clip-btn").on("click", function (event) {
		clearClipGeometry();
		clearSelectedImages();
		userClipped = false;
		if ($(this).text().trim() == "+") {
			closeAccordion();
			$('div[id^="collapse"]').each(function (index, element) {
				if ($(element).hasClass("show")) {
					wavesurfer.clearRegions();
					$(element).removeClass("show");
					$("#accordion" + index).addClass("collapsed");
				}
			});
			$(this).text("-");
			var start = "";
			var end = "";
			const regions = wavesurfer.regions.list;
			const numRegions = Object.keys(regions).length;
			if (numRegions > 0) {
				const regionId = Object.keys(regions)[0];
				const currentRegion = regions[regionId];
				start = convert_seconds_to_time(currentRegion.start);
				end = convert_seconds_to_time(currentRegion.end);
			} else {
				start = $("#runAudioTime").text();
			}
			//$("#startdate, #enddate").val("00:00:00");
			$("#startdate").val(start);
			$("#enddate").val(end);
			$("#add-clip-div").fadeIn();
			$("#clipsAccordion").fadeOut();
			$("#clip_name").val("");
			$("#clip_image").attr("src", "css/gallery.png");
			clippedGeometry.properties.isNew = true;
			clippedGeometry.properties.index = -1;
		} else {
			wavesurfer.clearRegions();
			$(this).text("+");
			$("#add-clip-div").fadeOut();
			$("#clipsAccordion").fadeIn();
			clippedGeometry.properties.isNew = false;
		}
	});

}

$("#clipLineString").on("click", async function (event) {
	clippedGeometry.properties.isNew = true;
	userClipped = true;
	postClip();
});

$("#cribAudioFile").on("click", async function (event) {
	($('#RequestCrib').prop("checked") == true) ? $('#RequestCrib').prop("checked", false) : $('#RequestCrib').prop("checked", true);
	($('#RequestCrib').prop("checked") == true) ? $('#cribAudioFile').addClass('depressed').fadeIn() : $('#cribAudioFile').removeClass('depressed').fadeIn();
});

function postClip(isFromClip = false) {
	var stEl = clippedGeometry.properties.isNew ? "startdate" : "startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "enddate" : "enddate" + clippedGeometry.properties.index;
	const st = document.getElementById(stEl).value;
	convertedStart = convert_time_to_seconds(st);
	const et = document.getElementById(enEl).value;
	convertedEnd = convert_time_to_seconds(et);
	if (!isNaN(convertedStart) && convertedEnd > 0) {
		clipGeometry();
	} else {
		notifier.warning("Clip length is too short. Must be at least 1 second.")
	}
}

// Saving an edited clip
function saveClipByIndex() {
	console.log("1tourJson2", tourJson2);
	console.log("index", clippedGeometry.properties.index);
	// clipGeometry();
	tourJson2.CLIPS[clippedGeometry.properties.index].CLIP_PATH = { ...clippedGeometry.geometry };
	tourJson2.CLIPS[clippedGeometry.properties.index].IS_FOR_REVIEW = $('#review-check' + clippedGeometry.properties.index)[0].checked;
	tourJson2.CLIPS[clippedGeometry.properties.index].CLIP_NAME = $('#clip_name' + clippedGeometry.properties.index).val();
	tourJson2.CLIPS[clippedGeometry.properties.index].START = convert_time_to_seconds($('#startdate' + clippedGeometry.properties.index).val());
	tourJson2.CLIPS[clippedGeometry.properties.index].END = convert_time_to_seconds($('#enddate' + clippedGeometry.properties.index).val());
	var trVal = $('#clip-transcription-' + clippedGeometry.properties.index).val();
	if (trVal !== "" && trVal !== "Transcription is still in progress...") {
		tourJson2.CLIPS[clippedGeometry.properties.index].TRANSCRIPTION = trVal;
	}
	console.log("2tourJson2", tourJson2);
	// a bit of a hack to close accordion - must add collapsed class as it does not register on click of save button.
	$('#accordion' + clippedGeometry.properties.index).addClass('collapsed');
	$('#accordion' + clippedGeometry.properties.index).click();
}

function smoothLineFunction(isChecked) {
	if (isChecked) {
		if (clippedGeometry !== undefined) {
			var dFts = Draw.getAll();
			if (dFts.features[0] !== undefined && dFts.features[0].geometry.coordinates.length > 2) {
				var cc = dFts.features[0].geometry.coordinates;
				// clippedGeometry.geometry.coordinates = [cc[0], cc[cc.length - 1]];
				addFeatureToEdit({
					...clippedGeometry, geometry: {
						...clippedGeometry.geometry,
						coordinates: [cc[0], cc[cc.length - 1]]
					}
				});
			}
			// clippedGeometry.geometry.coordinates = turf.cleanCoords(dFts.features[0]).geometry.coordinates;
			// clippedGeometry.geometry.coordinates = smooth(dFts.features[0].geometry.coordinates);

		}
	} else {
		if (clippedGeometry !== undefined) {
			console.log("unsmooth");
			console.log(clippedGeometry.geometry.coordinates);
			clipGeometry();
		}
	}
}

function convert_seconds_to_time(seconds) {
	seconds = Math.floor(seconds);
	var hours = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds % 3600) / 60);
	var remainingSeconds = seconds % 60;
	return (
		(hours < 10 ? '0' + hours : hours) +
		':' +
		(minutes < 10 ? '0' + minutes : minutes) +
		':' +
		(remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds)
	);
}

function onStartChange() {
	var crEl = "#runAudioTime";
	var mxEl = "#fullAudioTime";
	var stEl = clippedGeometry.properties.isNew ? "#startdate" : "#startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "#enddate" : "#enddate" + clippedGeometry.properties.index;
	var currentRegion = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]];
	if (currentRegion) {
		currentRegion.update({
			start: convert_time_to_seconds($(stEl).val())
		});
	} else {
		wavesurfer.addRegion({
			start: convert_time_to_seconds($(stEl).val()),
			end: convert_time_to_seconds($(enEl).val()),
			color: 'rgba(255, 0, 0, 0.5)'
		});
	}
	var crVal = convert_time_to_seconds($(crEl).text());
	var mxVal = convert_time_to_seconds($(mxEl).text());
	var stVal = convert_time_to_seconds($(stEl).val());
	var enVal = convert_time_to_seconds($(enEl).val());
	if (!isNaN(stVal)) {
		if (stVal > mxVal) {
			$(stEl).val($(mxEl).text());
			notifier.warning("Start time cannot be higher than total time.");
			return;
		}

		if (!isNaN(enVal) && enVal <= stVal) {
			$(enEl).val($(stEl).val());
			notifier.warning("Start time cannot be higher than end time.");
			return;
		}

		if (stVal === 0 && crVal !== stVal) {
			$(crEl).text('00:00:00');
			wavesurfer.stop();
		} else if (crVal !== stVal) {
			if (!isNaN(enVal)) {
				wavesurfer.play(stVal, enVal);
			} else {
				wavesurfer.play(stVal, mxVal);
			}
		}
	}
}

function onEndChange() {
	var crEl = "#runAudioTime";
	var mxEl = "#fullAudioTime";
	var stEl = clippedGeometry.properties.isNew ? "#startdate" : "#startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "#enddate" : "#enddate" + clippedGeometry.properties.index;
	var currentRegion = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]];
	if (currentRegion) {
		currentRegion.update({
			end: convert_time_to_seconds($(enEl).val())
		});
	} else {
		wavesurfer.addRegion({
			start: convert_time_to_seconds($(stEl).val()),
			end: convert_time_to_seconds($(enEl).val()),
			color: 'rgba(255, 0, 0, 0.5)'
		});
	}
	var crVal = convert_time_to_seconds($(crEl).text());
	var mxVal = convert_time_to_seconds($(mxEl).text());
	var stVal = convert_time_to_seconds($(stEl).val());
	var enVal = convert_time_to_seconds($(enEl).val());

	if (!isNaN(enVal) && !isNaN(stVal) && $(enEl).val().length === 8) {
		if (enVal <= stVal) {
			$(enEl).val($(stEl).val());
			notifier.warning("End time must be higher than start time.");
			return;
		} else if (enVal > mxVal) {
			$(enEl).val($(mxEl).text());
			notifier.warning("End time cannot be higher than total time.");
			return;
		}
		if (enVal !== 0 && crVal !== enVal) {
			wavesurfer.play(enVal - 1, enVal);
		}
	}
}

function updateInputsFromRegion(startTime, endTime) {
	var stEl = clippedGeometry.properties.isNew ? "#startdate" : "#startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "#enddate" : "#enddate" + clippedGeometry.properties.index;
	$(stEl).val(convert_seconds_to_time(startTime));
	$(enEl).val(convert_seconds_to_time(endTime));
}

function updateRegionFromClip(startTime, endTime) {
	if (wavesurfer.regions){
		var currentRegion = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]];
		if (currentRegion) {
			currentRegion.update({
				start: startTime,
				end: endTime
			})
		} else {
			wavesurfer.addRegion({
				start: startTime,
				end: endTime,
				color: 'rgba(255, 0, 0, 0.5)'
			});
		}
	}
}

function addFeatureToEdit(geometryObj) {
	Draw.deleteAll();
	var ftIDS = Draw.add(geometryObj.geometry);
	Draw.changeMode('simple_select', { featureIds: ftIDS });
}

function setClipTime(pos) {
	var stEl = clippedGeometry.properties.isNew ? "#startdate" : "#startdate" + clippedGeometry.properties.index;
	var enEl = clippedGeometry.properties.isNew ? "#enddate" : "#enddate" + clippedGeometry.properties.index;
	if (pos === 'left' || pos === true) {
		$(stEl).val($('#runAudioTime').text())
	} else {
		$(enEl).val($('#runAudioTime').text());
	}
	const st = $(stEl).val();
	const et = $(enEl).val();
	convertedStart = convert_time_to_seconds(st);
	convertedEnd = convert_time_to_seconds(et);
	if (!isNaN(convertedStart) && isNaN(convertedEnd) || convertedStart > convertedEnd) {
		$(enEl).val($('#runAudioTime').text());
	}
	//if (!isNaN(convertedStart) && convertedEnd > 0) {
	//    if (convertedEnd > convertedStart){
	//        clipGeometry();
	//    } else {
	//        notifier.warning("Clip length is not valid");
	//    }
	//}
}

function clipGeometry() {
	let _tourCoordinates = tourCoordinates.map(t => t.geometry.coordinates);
	let startIdx = tourCoordinates.findIndex(f => Math.round((Date.parse(f.properties.time) - Date.parse(tourCoordinates[0].properties.time)) / 1000) === convertedStart);
	let endIdx = tourCoordinates.findIndex(f => Math.round((Date.parse(f.properties.time) - Date.parse(tourCoordinates[0].properties.time)) / 1000) === convertedEnd);

	if (endIdx == -1) {
		startIdx = 0;
		endIdx = 0;
	}

	clearClipGeometry();
	clippedCoordinates = [];
	for (let i = startIdx; i <= endIdx; i++) {
		clippedCoordinates.push(_tourCoordinates[i]);
	}
	if (document.getElementById("smooth-line").checked) {
		// clippedCoordinates = smooth(clippedCoordinates);
		if (clippedCoordinates.length > 2) {
			var cc = clippedCoordinates;
			clippedCoordinates = [cc[0], cc[cc.length - 1]];
		}
	}
	console.log("clipped coordinates", clippedCoordinates);
	if (!userClipped) clippedCoordinates = [_tourCoordinates[startIdx]];
	clippedGeometry.geometry.coordinates = [...clippedCoordinates];
	addFeatureToEdit(clippedGeometry);
	var bb = turf.bbox(clippedGeometry);
	map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 50 });
}

function getClipGeometry() {
	let __clippedGeometry = {
		type: "LineString",
		coordinates: [],
	};

	let __tourCoordinates = tourCoordinates.map(t => t.geometry.coordinates);
	let __startIdx = tourCoordinates.findIndex(f => Math.round((Date.parse(f.properties.time) - Date.parse(tourCoordinates[0].properties.time)) / 1000) === convertedStart);
	let __endIdx = tourCoordinates.findIndex(f => Math.round((Date.parse(f.properties.time) - Date.parse(tourCoordinates[0].properties.time)) / 1000) === convertedEnd);

	if (__endIdx == -1) {
		__startIdx = 0;
		__endIdx = 0;
	}

	let __clippedCoordinates = [];
	for (let i = __startIdx; i <= __endIdx; i++) {
		__clippedCoordinates.push(__tourCoordinates[i]);
	}
	if (document.getElementById("smooth-line").checked) {
		// clippedCoordinates = smooth(clippedCoordinates);
		if (__clippedCoordinates.length > 2) {
			var cc = __clippedCoordinates;
			__clippedCoordinates = [cc[0], cc[cc.length - 1]];
		}
	}

	__clippedGeometry.coordinates = [...__clippedCoordinates];

	return __clippedGeometry;

}

const convert_time_to_seconds = (time) => {
	const [hours, minutes, seconds] = time.split(":");
	return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
};
function setSpeed(val) {
	if (wavesurfer !== null) {
		wavesurfer.setPlaybackRate(val)
	}
}

function findPhotoIndex(timestamp) {
	let minDiff = Infinity;
	let closestPhotoIndex = 0;
	let photos = tourJson2.PHOTOS;
	for (let i = 0; i < photos.length; i++) {
		const diff = timestamp - photos[i].TIMESTAMP;
		if (diff > 0 && diff < minDiff) {
			minDiff = diff;
			closestPhotoIndex = i;
		}
	}
	return closestPhotoIndex;
}

async function initWaveSurfer() {
	

	// load wavsurfer
	wavesurfer = WaveSurfer.create({
		container: "#waveform",
		waveColor: "#F5F5DC",
		progressColor: "#77bbff",
		barHeight: 2,
		normalize: true,
		barWidth: 3,
		backend: 'MediaElement'
	});

	clipsurfer = WaveSurfer.create({
		container: "#waveclip",
		waveColor: "#DCF5F5",
		progressColor: "#bb77ff",
		barHeight: 2,
		normalize: true,
		barWidth: 3,
		backend: 'MediaElement'
	});

	$('#waveform').on('click', function (event) {
		if ($('#large-image').is(':visible')) {
			const clickedPosition = event.offsetX / $(this).width();
			const audioDuration = wavesurfer.getDuration();
			const clickedTime = clickedPosition * audioDuration;
			console.log("clicked time", clickedTime);
			console.log("right photo index", findPhotoIndex(clickedTime));
			userClickedOnAudio = true;
			$('.carousel').carousel(findPhotoIndex(clickedTime));
		}
	});

	wavesurfer.on("loading", (e) => {
		$('#tour-mp3-status').text("Loading track... " + e + "%");
		if (e == 100) {
			$('#tour-mp3-status').text("");
		}
	});

	clipsurfer.on("loading", (e) => {
		$('#tour-mp3-status').text("Loading clip... " + e + "%");
		if (e == 100) {
			$('#tour-mp3-status').text("");
		}
	});

	wavesurfer.on("error", (e) => {
		if (e.toString().indexOf("404") !== -1) {
			$('#tour-mp3-status').text("Track not found.");
			notifier.warning("The audio track cannot be found!");
		} else if (e.toString().indexOf("AbortError") !== -1) { // Do nothing
		} else if (e.toString().indexOf("audiobuffer") !== -1) { // Do nothing
		} else {
			$('#tour-mp3-status').text("Failed to load audio track.");
			notifier.warning("The audio track did not load properly and may be corrupt! " + e.toString());
		}
	});

	clipsurfer.on("error", (e) => {
		if (e.toString().indexOf("404") !== -1) {
			$('#tour-mp3-status').text("Clip not found.");
			notifier.warning("The clip audio cannot be found!");
		} else if (e.toString().indexOf("AbortError") !== -1) { // Do nothing
		} else if (e.toString().indexOf("audiobuffer") !== -1) { // Do nothing
		} else {
			$('#tour-mp3-status').text("Failed to load clip track.");
			notifier.warning("The clip track did not load properly and may be corrupt! " + e.toString());
		}
	});


	wavesurfer.on("audioprocess", (e) => {
		var newTime = Math.round(wavesurfer.getCurrentTime());
		if (typeof newTime !== "undefined" && currentTime !== newTime) {
			currentTime = newTime;
		}
		document.getElementById("runAudioTime").innerHTML = new Date(newTime * 1000)
			.toISOString()
			.substr(11, 8);
		var currentTimeStamp = new Date(tourCoordinates[0].properties.time).getTime() + (newTime * 1000);
		var featureOnCurrentTimeStamp = tourCoordinates.find(f => Math.round(new Date(f.properties.time).getTime() / 1000) === Math.round(currentTimeStamp / 1000))

		if (clippedGeometry.properties.isNew) {
			if (!!featureOnCurrentTimeStamp) {
				try {
					marker.setLngLat(featureOnCurrentTimeStamp.geometry.coordinates);
				} catch {
					console.log("Lng Lat Coordinate information is not provided.")
				}
			}
		}
		// else {
		//     if (clippedGeometry.geometry.coordinates[newTime]) {
		//         marker.setLngLat(clippedGeometry.geometry.coordinates[newTime]);
		//     }
		// }

	});

	wavesurfer.on("finish", (e) => {
		document.getElementById("playPauseIcon").classList.remove("fa-pause");
		document.getElementById("playPauseIcon").classList.add("fa-play");
	});

	wavesurfer.on("ready", (e) => {
		console.log("wavesurfer ready");
		let audioTime = Math.round(wavesurfer.getDuration());
		document.getElementById("noOfSeconds").innerHTML = audioTime;
		document.getElementById("fullAudioTime").innerHTML = new Date(
			audioTime * 1000
		)
			.toISOString()
			.substr(11, 8);
		document.getElementById("runAudioTime").innerHTML = "00:00:00";
		console.log("ready to playPause button display block");
		document.getElementById("playPause").style.display = "block";
		document.getElementById("speed-select").style.display = "block";
		document.getElementById("timeCounter").style.display = "block";
		document.getElementById("pointSecond").style.display = "block";
		document.getElementById("waveform").style.display = "block";
		document.getElementById("waveclip").style.display = "none";
	});

	wavesurfer.on('play', function () {
		console.log("play");
		document.getElementById("playPauseIcon").classList.remove("fa-play");
		document.getElementById("playPauseIcon").classList.add("fa-pause");
	})

	wavesurfer.on('pause', function () {
		console.log("pause");
		document.getElementById("playPauseIcon").classList.remove("fa-pause");
		document.getElementById("playPauseIcon").classList.add("fa-play");
	})

	clipsurfer.on('play', function () {
		console.log("play");
		document.getElementById("playPauseIcon").classList.remove("fa-play");
		document.getElementById("playPauseIcon").classList.add("fa-pause");
	})

	clipsurfer.on('pause', function () {
		console.log("pause");
		document.getElementById("playPauseIcon").classList.remove("fa-pause");
		document.getElementById("playPauseIcon").classList.add("fa-play");
	})

	wavesurfer.on('region-click', function (region, e) {
		e.stopPropagation();
		if (document.getElementById('add-clip-btn').textContent.trim() == '+') {
			console.log("region cliked when add clip btn is +");
			var start = region.start;
			var end = region.end;
			document.getElementById('add-clip-btn').click();
			updateInputsFromRegion(start, end);
		}
	});

	wavesurfer.on('region-created', function (region) {
		var regions = wavesurfer.regions.list;
		for (var id in regions) {
			if (regions.hasOwnProperty(id)) {
				var existingRegion = regions[id];
				if (existingRegion !== region) {
					existingRegion.remove();
				}
			}
		}
	});

	wavesurfer.on('region-update-end', function (region) {
		region.play();
		if (clippedGeometry.properties.isNew) {
			updateInputsFromRegion(region.start, region.end);
		}
	});

	clipsurfer.on("ready", (e) => {
		let audioTime = Math.round(clipsurfer.getDuration());
		var totalNoOfSeconds = audioTime;
		document.getElementById("noOfSeconds").innerHTML = audioTime;
		document.getElementById("fullAudioTime").innerHTML = new Date(
			audioTime * 1000
		)
			.toISOString()
			.substr(11, 8);
		document.getElementById("runAudioTime").innerHTML = "00:00:00";
		//document.getElementById("playPause").style.display = "block";
		//document.getElementById("speed-select").style.display = "block";
		//document.getElementById("timeCounter").style.display = "block";
		//document.getElementById("pointSecond").style.display = "block";
		$("#waveclip").show();
		$("#waveform").hide();
	});

	document.querySelector("#playPause").addEventListener("click", async () => {
		if (wavesurfer.isPlaying() || clipsurfer.isPlaying()) {
			wavesurfer.pause();
			console.log("wave", wavesurfer);
			clipsurfer.pause();
			// document.getElementById("playPauseIcon").classList.remove("fa-pause");
			// document.getElementById("playPauseIcon").classList.add("fa-play");
			if ($('#add-clip-div').css('display') == 'block') {
				$('#enddate').val($('#runAudioTime').text())
			}
		} else {
			if ($('#waveform').css('display') == 'block') {
				wavesurfer.play();
			} else {
				clipsurfer.play();
			}
			// document.getElementById("playPauseIcon").classList.remove("fa-play");
			// document.getElementById("playPauseIcon").classList.add("fa-pause");
		}
	});
}

var Draw;

async function initMap(collection) {
	map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/mapbox/dark-v10",
		center: [0, 0],
		zoom: 0,
		maxZoom: 24
	});

	// Add zoom and rotation controls to the map.
	map.addControl(new mapboxgl.NavigationControl(), 'top-left');

	map.on("load", () => {
		// Add a new source from our GeoJSON data and
		// set the 'cluster' option to true. GL-JS will
		// add the point_count property to your source data.
		map.addSource('earthquakes', {
			type: 'geojson',
			// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
			// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
			data: collection,
			cluster: true,
			clusterMaxZoom: 14, // Max zoom to cluster points on
			clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
		});

		collection.features.forEach((feature) => {
			const f_nameKey = feature.properties.name;
			const el = document.createElement("div");

			el.className = `tourMarker ${f_nameKey == nameKey ? 'hidden-marker' : ''}`;
			el.style.backgroundImage = "url(css/marker.png)";
			el.onclick = () => {
				updateTourData(f_nameKey);
				// $('.hidden-marker').removeClass('hidden-marker');
				// el.classList.add('hidden-marker');
			}
			const marker = new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map);
			tourMarkers[f_nameKey] = marker;
		});

		map.addSource("route", {
			type: "geojson",
			data: {
				type: "Feature",
				properties: {},
				geometry: {
					type: "LineString",
					coordinates: tourCoordinates,
				},
			},
		});

		map.addLayer({
			id: "route",
			type: "line",
			source: "route",
			minZoom: 16,
			maxZoom: 20,
			layout: {
				"line-join": "round",
				"line-cap": "round",
			},
			paint: {
				"line-color": "#1E90FF",
				"line-width": 8,
				// 'line-width': [
				// 	'interpolate',
				// 	['linear'],
				// 	['zoom'],
				// 	0, 0,
				// 	5, 2,
				// 	10, 5,
				// 	12, 8
				// ],
			},

		});

		map.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'earthquakes',
			filter: ['has', 'point_count'],
			paint: {
				// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
				// with three steps to implement three types of circles:
				//   * Blue, 20px circles when point count is less than 100
				//   * Yellow, 30px circles when point count is between 100 and 750
				//   * Pink, 40px circles when point count is greater than or equal to 750
				'circle-color': [
					'step',
					['get', 'point_count'],
					'#51bbd6',
					100,
					'#f1f075',
					750,
					'#f28cb1'
				],
				'circle-radius': [
					'step',
					['get', 'point_count'],
					20,
					100,
					30,
					750,
					40
				]
			}
		});

		map.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'earthquakes',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': ['get', 'point_count_abbreviated'],
				'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
				'text-size': 12
			}
		});

		map.addLayer({
			id: 'unclustered-point',
			type: 'circle',
			source: 'earthquakes',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': '#11b4da',
				'circle-radius': 0,
				'circle-stroke-width': 0,
				'circle-stroke-color': '#fff'
			}
		});

		map.on('zoom', () => {
			const zoom = map.getZoom();
			$('.mapboxgl-marker').css('display', zoom >= 15 ? 'block' : 'none');
			$('.photoMarker').css('display', zoom > 16.5 ? 'block' : 'none');
		})

		// inspect a cluster on click
		map.on('click', 'clusters', (e) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});
			const clusterId = features[0].properties.cluster_id;
			map.getSource('earthquakes').getClusterExpansionZoom(
				clusterId,
				(err, zoom) => {
					if (err) return;

					map.easeTo({
						center: features[0].geometry.coordinates,
						zoom: zoom
					});
				}
			);
		});

		map.on('mouseenter', 'clusters', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'clusters', () => {
			map.getCanvas().style.cursor = '';
		});


		map.addSource("route-photos", {
			type: "geojson",
			data: {
				"type": "FeatureCollection",
				"features": []
			},
		});



		/* User enter mouse on map features */
		map.on("mouseenter", "route", () => {
			map.getCanvas().style.cursor = "pointer";
		});

		/* User leave mouse on map features */
		map.on("mouseleave", "route", () => {
			map.getCanvas().style.cursor = "";
		});

		/* When user click on map */
		map.on("click", "route", (e) => {
			console.log("map clicked");
			if ($('#large-image').hasClass('d-flex')) return;
			let clickedPoints = [];
			clickedPoints.push(e.lngLat.wrap().lng);
			clickedPoints.push(e.lngLat.wrap().lat);

			let _clickedFeature = tourCoordinates.find(t =>
				JSON.stringify(t.geometry.coordinates.map(v => parseFloat(v.toFixed(4)))) ===
				JSON.stringify(clickedPoints.map(v => parseFloat(v.toFixed(4)))));
			let _timeSeconds = Math.round((new Date(_clickedFeature.properties.time).getTime() - new Date(tourCoordinates[0].properties.time).getTime()) / 1000);

			// const addAbsDelta = (g) => (s, v, i) => s + Math.abs(v - g[i]);

			// var goal = clickedPoints,
			//     result = tourCoordinates.map(f=>f.geometry.coordinates).reduce((a, b) =>
			//         a.reduce(addAbsDelta(goal), 0) < b.reduce(addAbsDelta(goal), 0)
			//             ? a
			//             : b
			//     );

			//let slectedIndex = 0;
			// let _tourCoordinates = tourCoordinates.map(f=>f.geometry.coordinates);

			// for (var i = 0; i < _tourCoordinates.length; i++) {
			//     if (
			//         _tourCoordinates[i][0] == result[0] &&
			//         _tourCoordinates[i][1] == result[1]
			//     ) {
			//         slectedIndex = i;
			//         break;
			//     }
			// }
			if (Draw.getMode() === "simple_select") {
				marker.setLngLat(clickedPoints);
				wavesurfer.play();
				wavesurfer.play(_timeSeconds);
				document.getElementById("playPauseIcon").classList.remove("fa-play");
				document.getElementById("playPauseIcon").classList.add("fa-pause");
			}
		});


		var style = [
			// ACTIVE (being drawn)
			// line stroke
			{
				"id": "gl-draw-line",
				"type": "line",
				"filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
				"layout": {
					"line-cap": "round",
					"line-join": "round"
				},
				"paint": {
					"line-color": "#81FD94",
					"line-width": 8
				}
			},
			// vertex point halos
			{
				"id": "gl-draw-polygon-and-line-vertex-halo-active",
				"type": "circle",
				"filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
				"paint": {
					"circle-radius": 8,
					"circle-color": "#FFF"
				}
			},
			// vertex points
			{
				"id": "gl-draw-polygon-and-line-vertex-active",
				"type": "circle",
				"filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
				"paint": {
					"circle-radius": 5,
					"circle-color": "#fff",
				}
			},
			{
				'id': 'gl-draw-polygon-midpoint',
				'type': 'circle',
				'filter': ['all',
					['==', '$type', 'Point'],
					['==', 'meta', 'midpoint']],
				'paint': {
					'circle-radius': 3,
					'circle-color': '#fbb03b'
				}
			},
			// INACTIVE (static, already drawn)
			// line stroke
			{
				"id": "gl-draw-line-static",
				"type": "line",
				"filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
				"layout": {
					"line-cap": "round",
					"line-join": "round"
				},
				"paint": {
					"line-color": "#000",
					"line-width": 3
				}
			}
		];
		let modes = MapboxDraw.modes;
		modes = MapboxDrawWaypoint.enable(modes);
		Draw = new MapboxDraw({
			modes: modes,
			displayControlsDefault: false,
			styles: style,
			controls: {}
		});



		map.addControl(Draw, "bottom-left");
		map.on('draw.update', (e) => {
			if (clippedGeometry.geometry.coordinates.length > 0) {
				if (clippedGeometry.geometry.coordinates.length < e.features[0].geometry.coordinates.length) {
					isMiddleVertix = false;
				}
				clippedGeometry.geometry = e.features[0].geometry;
				if (!clippedGeometry.properties.isNew) {
					// tourJson2.CLIPS[clippedGeometry.properties.index].CLIP_PATH = clippedGeometry.geometry;
				}
			}
		})
		map.on('draw.selectionchange', (e) => {
			if (e.points.length > 0) {
				var currentPoint = JSON.stringify(e.points[0].geometry.coordinates)
				var dFts = Draw.getAll()
				var lineCs = dFts.features[0].geometry.coordinates;
				isMiddleVertix = true;
				if (currentPoint === JSON.stringify(lineCs[0]) || currentPoint === JSON.stringify(lineCs[lineCs.length - 1])) {
					// Draw.changeMode('simple_select', { featureIds: [dFts.features[0].id] });
					isMiddleVertix = false;
					// notifier.warning("Starting and ending vertices are not editable");
				}
			}
		});
		// map.on('draw.selectionchange', (e) => {
		//     try {
		//         if(e.points[0].geometry.type === "Point") {
		//             Draw.trash();
		//         }
		//     }catch (e) {
		//
		//     }
		// })
		map.on("click", "gl-draw-polygon-and-line-vertex-halo-active.hot", (e) => {
			setTimeout(() => {
				if (isMiddleVertix) {
					Draw.trash();
				}
			}, 200)

		});
		updateTourData(nameKey);
	});
	map.on('styleimagemissing', (e) => {
		const id = e.id;
		if (map.hasImage(id)) {
			return;
		}
		map.loadImage("/favicon.ico", (error, image) => {
			if (error) throw error;
			if (!map.hasImage(id)) {
				map.addImage(id, image);
			}
		});
	});

	map.on('move', () => {
		const { lng, lat } = map.getCenter();
		document.getElementById("mapCenter").innerHTML = `${lng}, ${lat}`;
	})
}

var isMiddleVertix = false;

function openImage(photos, index) {
	console.log("photos in viewer", photos);
	console.log("photo clicked");
	$('#large-image').addClass('d-flex').fadeIn();
	// $('#large-image img').attr("src", url);
	var indicatorsDiv = $('.carousel-indicators');
	indicatorsDiv.empty();
	var indicatorsTemplate = '';

	var innerDiv = $('.carousel-inner');
	innerDiv.empty();
	var innerTemplate = '';

	photos.forEach((photo, idx) => {
		// add items to buttonsDiv
		indicatorsTemplate += `
			<button 
				type="button"
				data-bs-target="#carouselExampleIndicators"
				data-bs-slide-to="${idx}"
				class="${idx === index ? 'active' : ''}"
				aria-current="${idx === index ? 'true' : 'false'}"
				aria-label="slides">
			</button>`;

		// add items to imagesDiv
		var isActive = idx === index ? 'active' : '';
		innerTemplate += `
			<div class="carousel-item ${isActive}">
				<img src="${awsServer}${photo.FILE}"
					class="d-block"
					alt="Image ${idx + 1}">
      </div>`;
	});
	indicatorsDiv.html(indicatorsTemplate);
	innerDiv.html(innerTemplate);
	$('.carousel').carousel({
		interval: false
	});
	console.log("timestamp", photos[index].TIMESTAMP);
	wavesurfer.play(photos[index].TIMESTAMP);
	console.log("tourjson2", tourJson2);
}

function closeImage() {
	$('#large-image').removeClass('d-flex').fadeOut();
	wavesurfer.pause();
}

function changeTour(nameKey) {
	window.history.pushState({}, "", "#" + nameKey);
	$("#playPause").hide();
	$("#speed-select").hide();
	$("#pointSecond").hide();
	$("#playPauseIcon").removeClass("fa-pause");
	$("#clip_edit").removeClass("active");
	$("#playPauseIcon").addClass("fa-play");
	$("#runAudioTime").val("00:00:00");
	$("#fullAudioTime").val("00:00:00");
}

// When loading a new tour...
const updateTourData = async (nameKey) => {
	// tour information change		
	$('.hidden-marker').removeClass('hidden-marker');
	const tourMarker = tourMarkers[nameKey];
	tourMarker.getElement().classList.add('hidden-marker');

	// tour change handler
	changeTour(nameKey);

	clearClipGeometry();
	convertedEnd = 0;
	convertedStart = 0;
	currentTime = 0;
	audioFile = `${awsServer}${nameKey}.mp3`;
	wavesurfer.load(audioFile);
	tourCoordinates = await fetchTourCoordinates(nameKey);

	map.getSource("route").setData({
		type: "Feature",
		properties: {},
		geometry: {
			type: "LineString",
			coordinates: tourCoordinates.map(f => f.geometry.coordinates),
		},
	});

	if (tourCoordinates.length > 0) {
		console.log(tourCoordinates);
		if (marker === null) {
			marker = new mapboxgl.Marker().setLngLat(tourCoordinates[0].geometry.coordinates).addTo(map);
		} else {
			marker.setLngLat(tourCoordinates[0].geometry.coordinates);
		}
		const line = turf.lineString(tourCoordinates.map(f => f.geometry.coordinates));
		const bbox = turf.bbox(line);
		map.fitBounds(bbox, { padding: 40, bearing: 0, pitch: 0, duration: 5000 });
	}

	tourJson2 = await fetchTourJson2(nameKey);
	console.log("fetchedData", tourJson2);
	if (tourJson2.CLIPS == null) {
		tourJson2.CLIPS = []
	}
	checkLogin();
	document.querySelector('#gallery-modal-body-new-photos').innerHTML = "";
	for (let i = 0; i < tourJson2.PHOTOS.length; i++) {
		if (tourJson2.PHOTOS[i].FILE != null) {
			let div = document.createElement('div');
			let fileName = tourJson2.PHOTOS[i].FILE.slice(0, -4);
			div.innerHTML = `
        <img
					class="m-2 p-1 border rounded-lg gallery-photos-selected"
					onclick="imageSelectedSelected('${fileName}', '${awsServer}${tourJson2.PHOTOS[i].FILE}')"
					id="gallery-photo-id-selected-${fileName}" 
					src="${awsServer}${tourJson2.PHOTOS[i].FILE}"
					alt="Image"
					width="250"
					height="250">`;
			document.querySelector('#gallery-modal-body-new-photos').appendChild(div);
		}
	}

	photoMarkers.forEach((item) => {
		item.remove();
	});
	photoMarkers = [];
	map.getStyle().layers.forEach((lyr) => {
		if (lyr.id.indexOf("photo-marker-") !== -1) {
			map.removeLayer(lyr.id);
		}
	})
	if (tourJson2.PHOTOS && tourJson2.PHOTOS.length > 0) {
		// var photoGeojson = {
		//     "type": "FeatureCollection",
		//     "features": [
		//     ]
		// }
		// photoGeojson.features = tourJson2.PHOTOS.map((pt) => {
		//     return {
		//         "type": "Feature",
		//         "properties": {
		//             'url': pt.FILE
		//         },
		//         "geometry": {
		//             "type": "Point",
		//             "coordinates": [
		//                 Number(pt.COORDINATES.LONG),
		//                 Number(pt.COORDINATES.LAT)
		//             ]
		//         }
		//     }
		// });
		// return;
		// map.getSource("route-photos").setData(photoGeojson);
		// tourJson2.PHOTOS.forEach((pt, index) => {
		//     map.addLayer({
		//         'id': 'photo-marker-'+nameKey+"-"+index,
		//         'type': 'symbol',
		//         'source': 'route-photos',
		//         'layout': {
		//             'icon-image': ['get', 'url'],
		//             'icon-size': 0.1
		//         }
		//     });
		// });
		tourJson2.PHOTOS.sort((photo1, photo2) =>
			photo1.TIMESTAMP - photo2.TIMESTAMP
		).forEach((item, index) => {
			console.log("photo", item);
			const lng = item.COORDINATES.LONG;
			const lat = item.COORDINATES.LAT;

			if (lng && lat) {
				const el = document.createElement("div");
				el.className = "photoMarker";
				el.style.backgroundImage = `url(${imgServer}${item.FILE})`;
				el.onclick = () => {
					// openImage(`${awsServer}${item.FILE}`, item.TIMESTAMP, index);
					openImage(tourJson2.PHOTOS, index);
				}

				const photoMarker = new mapboxgl.Marker(el)
					.setLngLat([lng, lat])
					.addTo(map);
				photoMarkers.push(photoMarker);
			}
		});

	}

	showJson2Form(tourJson2);

	document.getElementById("noOfPoint").innerHTML = tourCoordinates.length;
};

const showJson2Form = (json2) => {
	emptyForm();

	document.getElementById("name").value = "";
	document.getElementById("guidename").value = "";
	document.getElementById("photographername").value = "";
	document.getElementById("mainphoto").src = "#";
	document.getElementById("languageSelect").selectedIndex = 0;
	document.getElementById("clip_edit").innerHTML = "";

	if (json2) {
		document.getElementById("name").value =
			json2.METADATA?.TOUR_NAME.trim() || "";
		document.getElementById("guidename").value =
			json2.METADATA?.GUIDE_NAME || "";
		document.getElementById("photographername").value =
			json2.METADATA?.PHOTOG_NAME || "";

		for (
			var i = 0, j = document.getElementById("languageSelect").options.length;
			i < j;
			++i
		) {
			if (
				document.getElementById("languageSelect").options[i].value ===
				json2.METADATA?.LANGUAGE_ID
			) {
				document.getElementById("languageSelect").selectedIndex = i;
				break;
			}
		}

		if (json2.METADATA?.MAIN_PHOTO != null) {
			document.getElementById(
				"mainphoto"
			).src = `${imgServer}${json2.METADATA?.MAIN_PHOTO}`;
			document.getElementById("mainphoto").style.display = "inline";
		} else if (json2.PHOTOS?.length > 0) {
			document.getElementById(
				"mainphoto"
			).src = `${imgServer}${json2.PHOTOS[0].FILE}`;
			document.getElementById("mainphoto").style.display = "inline";
		} else {
			// document.getElementById("mainphoto").style.display = "none";
		}

		if (json2.CLIPS != null) {
			//var allClips = data.CLIPS;
			//tourClips = allClips.CLIP;
			//document.getElementById('clip_edit').innerHTML =(allClips.CLIP.CLIP_NAME);
			success({ items: json2.CLIPS });
		}
	}
};

const emptyForm = () => {
	document.getElementById("clip_name").value = "";
	document.getElementById("transcriptios").value = "";
	document.getElementById("startdate").value = "";
	document.getElementById("enddate").value = "";
	document.getElementById("clip_image").src = "css/gallery.png";
};

const editform = async () => {
	document.getElementById("clip_name").value = tourClips.CLIP_NAME;
	document.getElementById("transcriptios").value = tourClips.TRANSCRIPTION;
	document.getElementById("startdate").value = covert_time(tourClips.START);
	document.getElementById("enddate").value = covert_time(tourClips.END);
	document.getElementById("clip_image").src = imgServer + tourClips.CLIP_PHOTO;
};

const covert_time = (time) => {
	const sec = time;
	let hours = Math.floor(sec / 3600);
	let minutes = Math.floor((sec - hours * 3600) / 60);
	let seconds = sec - hours * 3600 - minutes * 60;
	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var re_time = hours + ":" + minutes + ":" + seconds;
	return re_time;
};

async function fetchTours() {
	console.log("tours fetch url", `${apiServer}?tour=${nameKey}`, { method: "GET", credentials: "include", cache: "no-cache" });
	const response = await fetch(`${apiServer}?tour=${nameKey}`, { method: "GET", credentials: "include", cache: "no-cache" });
	if (response.ok) {
		const json = await response.json();
		return json.files;
	} else {
		//g(response.status);
		return [];
	}
}

async function fetchLanguages() {
	console.log("langs fetch url", `${langServer}`, { method: "GET", cache: "no-cache" });
	const response = await fetch(`${langServer}`, { method: "GET", cache: "no-cache" });
	if (response.ok) {
		const json = await response.json();
		return json.results;
	} else {
		return [];
	}
}

async function fetchTourCoordinates(nameKey) {
	const response = await fetch(`${awsServer}${nameKey}.json`, { cache: "no-cache" });
	if (response.ok) {
		const json = await response.json();
		const features = json.features;
		const lineCoordinates = [];
		features.forEach((feature, idx) => {
			if (typeof starttimelapsed === 'undefined') {
				var starttimelapsed = feature.properties.time;
			}
			if ("geometry" in feature) {
				var coords = feature.geometry.coordinates;
				// var secnds = ((Date.parse(feature.properties.time) - Date.parse(starttimelapsed))/1000);
				lineCoordinates.push(coords);
			} else {
				feature["geometry"] = JSON.parse('{"type":"Point","coordinates":""}');
				lineCoordinates.push(coords);
			}
		});
		return features;
	} else {
		if (response.status === 404) {
			notifier.warning("Tour path cannot be found!");
		}
		return [];
	}
}

async function fetchTourJson2(nameKey) {
	const response = await fetch(`${awsServer}${nameKey}.json2`, { cache: "no-cache" });
	if (response.ok) {
		const json = await response.json();
		if (json.METADATA.TOUR_NAME.trim().length > 0) {
			$('#tourSelect option:selected').text(json.METADATA.TOUR_NAME);
			tourNames[nameKey] = json.METADATA.TOUR_NAME;
			setCookie("tour_names", JSON.stringify(tourNames), 10);
		}
		var isTourHasNewTxt = false;
		if (json.CLIPS !== null) {
			for (let i = 0; i < json.CLIPS.length; i++) {
				if (json.CLIPS[i].CLIP_FILE.indexOf(".mp3") !== -1) {
					if (json.CLIPS[i].TRANSCRIPTION === "") {
						var transcription = await fetchClipTranscription(json.CLIPS[i].CLIP_FILE + ".txt");
						try {
							transcription = transcription.results.transcripts.map(tr => tr.transcript);
							json.CLIPS[i].TRANSCRIPTION = transcription.join("<br>");
							isTourHasNewTxt = true;
						} catch (e) {

						}
					}
				}
			}
		}
		if (isTourHasNewTxt) {
			tourJson2 = json;
			saveChanges(false);
		}
		return json;
	} else {
		if (response.status === 404) {
			return {
				"METADATA": {
					"TOUR_NAME": "",
					"GUIDE_NAME": "",
					"GUIDE_ORG": "",
					"GUIDE_ETHWALLET": "",
					"PHOTOG_NAME": "",
					"MAIN_PHOTO": null,
					"USER_ETHWALLET": "",
					"USER_EMAIL": "",
					"LOCATION": {
						"PLACE": "", "CITY": "", "COUNTRY": ""
					},
					"language": "English",
					"LANGUAGE_ID": "1"
				},
				"CLIPS": [],
				"PHOTOS": []
			};
		}
		return null;
	}
}

function deleteAccordionItem(e, index) {
	console.log("press delete icon");
	console.log(index);
	$("#accordion" + index).hide();
	$("#collapse" + index).parent().hide();
	tourJson2.CLIPS[index].isDeleted = true;
	e.stopPropagation();
	closeAccordion();
}

var success = function () {
	$("#clipsAccordion").empty();
	tourJson2.CLIPS.forEach(function (item, index) {
		if (item.isDeleted)
			return;
		var clipSrc = 'css/gallery.png';
		if (item.CLIP_PHOTO !== '') {
			if (newClipPhotos.hasOwnProperty(item.CLIP_PHOTO)) {
				clipSrc = newClipPhotos[item.CLIP_PHOTO];
			} else {
				clipSrc = imgServer + item.CLIP_PHOTO;
			}
		}
		var isForReview = item.IS_FOR_REVIEW ? 'checked' : '';
		const template = `
			<div class="accordion-item">
				<h2 class="accordion-header" id="header${index}">
					<button 
						class="accordion-button collapsed" 
						type="button"
						data-bs-toggle="collapse" 
						data-bs-target="#collapse${index}" 
						aria-expanded="false" 
						aria-controls="collapse${index}" 
						id="accordion${index}"
					>
						<div class="accordion-button-content" style="width: 100%; display: flex; justify-content: space-between; padding: 0px 10px;">
							<span>${item.CLIP_NAME}</span>
							<i class="fas fa-times close-button redx hide" id="xicon${index}" onclick="deleteAccordionItem(event, ${index})"></i>
						</div>
					</button>
				</h2>
				<div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="header${index}" data-bs-parent="#clipsAccordion">
					<div class="accordion-body p-0">
						<div class="form-group input-material row" style="margin-left: 2%">
							<input 
								value="${item.CLIP_NAME}" 
								id="clip_name${index}" 
								type="search" 
								required 
								onkeyup="document.getElementById(\`accordion${index}\`).textContent = this.value;" 
							/>
							<img 
								src="${clipSrc}" 
								onclick="openGalleryForID(this.id)" 
								class="clippedImage" 
								id="clip_image${index}" 
							/>
						</div>
						<div class="timeblock" style="display: flex; margin-left: 0.5rem; margin-bottom: 0.2rem">
							<button disabled class="setClipTime-left disabled">{</button>
							<input value="${covert_time(item.START)}" initvalue="${covert_time(item.START)}" id="startdate${index}" onkeyup="onStartChange()" placeholder="00:00:00" class="rounded start_time" readonly />
							<input value="${covert_time(item.END)}" initvalue="${covert_time(item.END)}" id="enddate${index}" onkeyup="onEndChange()" placeholder="00:00:00"  class="rounded end_time" readonly />
							<button disabled class="setClipTime-right disabled">}</button>
						</div>
						<div class="form-group" style="margin-left: 3%; margin-bottom: 0.5rem">
							<textarea id="clip-transcription-${index}" class="form-control transcript"></textarea>
							<div style="display: flex; margin-left: 0.5rem; margin-bottom: 0.2rem">
								<div>
									<button disabled href="${index}" onclick="postClip(true)" class="btn btn-primary" style="width: 3rem; padding: 2%; color: #fff; background-color: #0095fc; text-transform: uppercase; outline: 0; border-style: none; cursor: pointer;">Clip</button>
								</div>
								<div style="margin-left: 1rem;margin-top: 5px;">
									<label class="switch">
										<input onchange="smoothLineFunction(this.checked)" type="checkbox"/>
										<span class="slider round"></span>
									</label>
								</div>
								<div style="margin-left: 1rem">smooth line</div>
								<i style="margin-left: 1rem; margin-top: 0.3rem; cursor: pointer" class="fa fa-copy fa-regular fa-inverse" onclick="copyJsonToClipboard()"></i>
							</div>
							<div style="display: flex; margin-left: 0.5rem; margin-bottom: 0.5rem">
								<div>
									<button onclick="saveClipByIndex()" type="submit" class="btn btn-primary saveBtn">SAVE</button>
								</div>
								<div style="margin-left: 1rem;margin-top: 5px;">
									<label class="switch">
										<input ${isForReview ? 'checked' : ''} id="review-check${index}" type="checkbox"/>
										<span class="slider round"></span>
									</label>
								</div>
								<div style="margin-left: 1rem">request review</div>
							</div>
						</div>
					</div>
				</div>
			</div>`;
		$("#clipsAccordion").append(template);
	});
};

function openGalleryForID(id) {
	selectedGalleryImages.img_id = id;
	document.querySelector('#gallery-modal-open-button').click();
}

// success(data);
document.getElementById("clip_image").addEventListener('click', function () {
	//if (clippedGeometry.geometry.coordinates.length === 0) {
	//    notifier.warning("Clip geometry is not ready. Click on the clip button.");
	//    return;
	//}
	openGalleryForID("clip_image");
})

function imageSelected(id, src) {
	for (let i = 0; i < document.querySelectorAll('.gallery-photos').length; i++) {
		document.querySelectorAll('.gallery-photos')[i].classList.remove('bg-primary');
	}
	selectedGalleryImages.image_type = 'new';
	selectedGalleryImages.src = src;
	document.querySelector(`#gallery-photo-id-${id}`).classList.add('bg-primary');
}

function imageSelectedSelected(id, src) {
	for (let i = 0; i < document.querySelectorAll('.gallery-photos-selected').length; i++) {
		document.querySelectorAll('.gallery-photos-selected')[i].classList.remove('bg-primary');
	}
	selectedGalleryImages.image_type = 'old';
	selectedGalleryImages.src = src;
	document.querySelector(`#gallery-photo-id-selected-${id}`).classList.add('bg-primary');
}

function showNewImages() {
	var latLong = [0, 0];
	if (selectedGalleryImages.img_id.indexOf('clip_image') !== -1 && clippedGeometry.geometry.coordinates[0] !== undefined) {
		// clips
		latLong = clippedGeometry.geometry.coordinates[0];
	} else {
		// main
		latLong = tourCoordinates[convert_time_to_seconds($('#runAudioTime').text())].geometry.coordinates
	}

	fetch(`https://www.flickr.com/services/rest/?method=flickr.photos.search&lat=${latLong[1]}&lon=${latLong[0]}&radius=.5&api_key=8759b9a7f8a974bc21a89e46ed527a90`)
		.then(response => response.text())
		.then((data) => {
			let div = document.createElement('div');
			div.innerHTML = data;
			let photos = div.querySelectorAll('photo')
			document.querySelector('#gallery-loader').setAttribute('style', 'display:none');
			document.querySelector('#gallery-modal-body').innerHTML = "";
			for (let i = 0; i < photos.length; i++) {
				let div = document.createElement('div');
				div.innerHTML = `<img class="m-2 p-1 border rounded-lg gallery-photos" onclick="imageSelected(${photos[i].id}, 'https://live.staticflickr.com/${photos[i].getAttribute('server')}/${photos[i].getAttribute('id')}_${photos[i].getAttribute('secret')}.jpg')" id="gallery-photo-id-${photos[i].id}" src="https://live.staticflickr.com/${photos[i].getAttribute('server')}/${photos[i].getAttribute('id')}_${photos[i].getAttribute('secret')}.jpg" alt="Image" width="250" height="250">`;
				document.querySelector('#gallery-modal-body').appendChild(div);
			}
		});
}

function showSelectedValue() {
	document.getElementById(selectedGalleryImages.img_id).setAttribute('src', selectedGalleryImages.src);
	var srcSpl = selectedGalleryImages.src.split('/');
	var filename = srcSpl[srcSpl.length - 1];
	if (selectedGalleryImages.img_id === 'mainphoto') {
		tourJson2.METADATA.MAIN_PHOTO = filename;
		if (selectedGalleryImages.image_type === 'new') {
			let latLong = tourCoordinates[convert_time_to_seconds($('#runAudioTime').text())];
			newClipPhotos[filename] = selectedGalleryImages.src;
			tourJson2.PHOTOS.push({
				COORDINATES: {
					ELEV: 0,
					HEADING: 0,
					LAT: latLong[1],
					LONG: latLong[0]
				},
				FILE: tourJson2.METADATA.MAIN_PHOTO,
				TIMESTAMP: "0"
			});
		}
	} else if (selectedGalleryImages.img_id !== 'clip_image') {
		var ind = Number(selectedGalleryImages.img_id.replace('clip_image', ''))
		tourJson2.CLIPS[ind].CLIP_PHOTO = filename;
		if (selectedGalleryImages.image_type === 'new') {
			let latLong = clippedGeometry.geometry.coordinates[0];
			newClipPhotos[filename] = selectedGalleryImages.src;
			tourJson2.PHOTOS.push({
				COORDINATES: {
					ELEV: 0,
					HEADING: 0,
					LAT: latLong[1],
					LONG: latLong[0]
				},
				FILE: filename,
				TIMESTAMP: "0"
			});
		}
	}
	$('#gallery-modal').modal('hide');
}
