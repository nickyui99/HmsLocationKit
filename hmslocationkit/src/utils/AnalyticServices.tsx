


export default class AnalyticsService{



   
    async setAnalyticsEvent(){
        /**
		 * Report custom events.
		 */
		const eventId = "getLastLocation"
		const bundle = {"name": "exam_difficulty", "value": "high"}
		HMSAnalytics.onEvent(eventId, bundle)
			.then((res) => { console.log(JSON.stringify(res)) })
			.catch((res) => { console.log(JSON.stringify(res)) });
    }

}