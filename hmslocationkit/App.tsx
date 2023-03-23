/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, Alert } from 'react-native';
import { Button, SearchBar } from '@rneui/themed';
import styles from './src/res/styles';
import HMSLocation from "@hmscore/react-native-hms-location";
import requestLocationPermission from './src/utils/AndroidPermissions';
import HMSAnalytics from '@hmscore/react-native-hms-analytics';

function App(): JSX.Element {

	const [locationInfo, setLocationInfo] = useState({
		hwLocationList: {},
		lastHWLocation: {},
		lastLocation: {}
	});

	const [locationQuery, setLocationQuery] = useState("");
	const [searchResult, setSearchResult] = useState("");

	const locationRequest = {
		priority: HMSLocation.FusedLocation.Native.PriorityConstants.PRIORITY_HIGH_ACCURACY,
		interval: 3,
		numUpdates: 10,
		fastestInterval: 1000.0,
		expirationTime: 200000.0,
		expirationTimeDuration: 200000.0,
		smallestDisplacement: 0.0,
		maxWaitTime: 2000000.0,
		needAddress: true,
		language: 'en',
		countryCode: 'en',
	};

	const locationSettingsRequest = {
		locationRequests: [locationRequest],
		alwaysShow: true,
		needBle: true,
	}

	useEffect(() => {
		initHmsAnalytics();
		setAnalyticsEnabled(true);
		checkDeviceLocationSettings();
	}, []);

	const initHmsAnalytics = async () => {
		await HMSAnalytics.getInstance()
			.then((res) => {
				console.log("analyticGetInstance: ", JSON.stringify(res));
			})
			.catch((res) => {
				console.log(JSON.stringify(res));
			});
	}

	const setAnalyticsEnabled = async (isEnable) => {
		await HMSAnalytics.setAnalyticsEnabled(isEnable)
			.then((res) => {
				console.log("analyticEnabled", res);
			})
			.catch((err) => {
				console.log("analyticEnabled", err);
			});
	}

	const setAnalyticsEvent = (eventId, bundle) => {
		/**
		 * Report custom events.
		 */
		HMSAnalytics.onEvent(eventId, bundle)
			.then((res) => { console.log(JSON.stringify(res)) })
			.catch((res) => { console.log(JSON.stringify(res)) });
	}

	const checkDeviceLocationSettings = () => {
		setAnalyticsEvent("checkDeviceLocationSettings", {});
		//Checking the device location settings
		HMSLocation.FusedLocation.Native.checkLocationSettings(locationSettingsRequest)
			.then(res => {
				console.log("Location setting result:", JSON.stringify(res, null, 2));
				requestLocationUpdatesWithCallback();
			})
			.catch(err => {
				console.log("Error while getting location settings. " + err);
				//request location permission for android
				requestLocationPermission();
			});
	}

	/**
	 * This method is used to obtain the last location of the device
	 */
	const getLastLocation = () => {
		setAnalyticsEvent("getLastLocation", {});
		HMSLocation.FusedLocation.Native.getLastLocation()
			.then(lastLocResult => {
				console.log("Last location:", JSON.stringify(lastLocResult, null, 2));
				Alert.alert("Last Location", JSON.stringify(lastLocResult, null, 2), [{ text: 'OK', onPress: () => console.log('OK Pressed') },]);
			})
			.catch(err => console.log('Failed to get last location', err));
	};


	/**
	 * This method is used to request location updates using the callback on the specified Looper thread, and then returns the
	 * 	location request ID if the request was successful.
	 */
	const requestLocationUpdatesWithCallback = async () => {
		setAnalyticsEvent("requestLocationUpdatesWithCallback", {});
		await HMSLocation.FusedLocation.Native.requestLocationUpdatesWithCallback(locationRequest)
			.then(({ requestCode }) => {
				console.log("requestCode:", requestCode);
				requestId = requestCode;
			})
			.catch(ex => console.log("Exception while requestLocationUpdatesWithCallback " + ex));

		const handleLocationUpdate = locationResult => {
			const { hwLocationList: [location = {}], lastHWLocation, lastLocation } = locationResult
			console.log("hwLocationList: ", location);
			console.log("lastHwLocation: ", lastHWLocation);
			console.log("lastLocation: ", lastLocation);
			setLocationInfo({
				hwLocationList: location,
				lastHWLocation: lastHWLocation,
				lastLocation: lastLocation
			});
		};
		await HMSLocation.FusedLocation.Events.addFusedLocationEventListener(handleLocationUpdate);
	}

	/**
	 * This method is to enable background location
	 * 	[!] This method is added in Location Kit 6.0.0, and is available only for non-Huawei Android phones.
	 */
	const enableBackgroundLocation = async () => {
		setAnalyticsEvent("enableBackgroundLocation", {});

		const id = 3;
		const notification = {
			contentTitle: 'Current Location',
			category: 'service',
			priority: 2,
			channelName: 'MyChannel',
			contentText: 'Location Notification',
			defType: "mipmap",
			resourceName: "ic_launcher",
		};

		await HMSLocation.FusedLocation.Native.enableBackgroundLocation(id, notification)
			.then(() => {
				console.log('Success');
			})
			.catch((err) => alert(err.message));
	}

	const getFromLocationNameRequest = () => {
		// locationName: address information
		// maxResults: maximum number of returned results
		const getFromLocationNameRequest = {
			locationName: locationQuery,
			maxResults: 3
		};

		// language: language code
		// country: country code
		const locale = {
			language: "en",
			country: "us"
		};

		HMSLocation.Geocoder.Native.getFromLocationName(getFromLocationNameRequest, locale)
			.then((hwLocationList) => {
				setSearchResult(JSON.stringify(hwLocationList, null, 3));
				console.log('Result: ', JSON.stringify(hwLocationList, null, 3));
			})
			.catch((err) => alert(err.message));
	}


	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>HMS React Native Location Kit</Text>
			<View style={[styles.height_20, styles.margin_vertical_m]}>
				<ScrollView style={[styles.flexGrow]}>
					<Text>Latitude: </Text>
					<Text>{locationInfo.lastHWLocation.latitude}</Text>
					<Text>Longitude: </Text>
					<Text>{locationInfo.lastHWLocation.longitude}</Text>
					<Text>Address: </Text>
					<Text>{locationInfo.lastHWLocation.featureName}</Text>
				</ScrollView>
			</View>
			<View style={styles.margin_vertical_sm}>
				<SearchBar
					placeholder='Location Name'
					lightTheme
					onChangeText={value => {
						setLocationQuery(value);
					}}
					value={locationQuery}
				/>
				<Button buttonStyle={styles.margin_vertical_sm} onPress={getFromLocationNameRequest}>Search</Button>
				<View style={styles.height_50}>
					<ScrollView>
						<Text>{searchResult}</Text>
					</ScrollView>
				</View>
			</View>
			<View style={styles.bottomContainer}>
				<Button buttonStyle={styles.margin_vertical_sm} onPress={getLastLocation}>Get Last Location</Button>
				<Button buttonStyle={styles.margin_vertical_sm} onPress={enableBackgroundLocation}>Enable Background Location</Button>
			</View>
		</SafeAreaView>
	);
}

export default App;
