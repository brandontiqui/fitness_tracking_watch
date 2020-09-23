const Workout = require('./Workout');

class Wearer {
  constructor(simulatedData) {
    this.workoutInstance = null;
    // data is entered in chronological order
    this.stepData = {stepsSummary: [], rawData: []};
    this.caloriesBurnedData = {summary: [], rawData: []};
    this.heartRateData = {rawData: {resting: [], active: []}};
    this.isResting = true;

    if (simulatedData) {
      this.processSimulatedData(simulatedData);
    }
  }

  processSimulatedData(simulatedData) {
    const {heartRateData} = simulatedData;
    if (heartRateData) {
      let timeWhenMeasured = heartRateData.startTime;
      heartRateData.heartRate.forEach(heartRate => {
        this.storeHeartRateData({
          timeWhenMeasured: timeWhenMeasured,
          heartRate: heartRate
        });
        timeWhenMeasured += 60;
      });
    }
  }

  getStepsSummary() {
    return this.stepData.stepsSummary;
  }

  getDataSummary(dataCategory) {
    return this[`${dataCategory}Data`].summary;
  }

  getHeartRateData() {
    return this.heartRateData;
  }

  startWorkout(simulatedWatchData) {
    if (!this.workoutInstance) {
      this.isResting = false;
      this.workoutInstance = new Workout(simulatedWatchData);
    } else {
      console.log('There is a workout in progress');
    }
  }

  storeStepData(newStepData) {
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newStepData.startTime / secondsPerDay);
    // add steps to last data point or insert
    const lastDataPoint = this.stepData.stepsSummary[this.stepData.stepsSummary.length - 1];
    if (lastDataPoint && lastDataPoint.daysSinceUnixEpoch === daysSinceUnixEpoch) {
      lastDataPoint.steps += newStepData.steps;
    } else {
      this.stepData.stepsSummary.push({
        daysSinceUnixEpoch: daysSinceUnixEpoch,
        steps: newStepData.steps
      });
    }
    this.stepData.rawData.push(newStepData);
  }

  storeData(newData, dataCategory) {
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newData.startTime / secondsPerDay)

    const source = this[`${dataCategory}Data`];
    const lastDataPoint = source.summary[source.summary.length - 1];
    if (lastDataPoint && lastDataPoint.daysSinceUnixEpoch === daysSinceUnixEpoch) {
      lastDataPoint[dataCategory] += newData[dataCategory];
    } else {
      let payload = {
        daysSinceUnixEpoch: daysSinceUnixEpoch,
        [dataCategory]: newData[dataCategory]
      };
      if (dataCategory === 'caloriesBurned') {
        payload.workoutType = newData.workoutType;
      }
      source.summary.push(payload);
    }
    source.rawData.push(newData);
  }

  storeHeartRateData(newHeartRateData) {
    /*
      {
        timeWhenMeasured: Number (UNIX timestamp),
        heartRate: Number
      }
     */
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newHeartRateData.timeWhenMeasured / secondsPerDay);
    const newData = Object.assign({}, newHeartRateData, {daysSinceUnixEpoch: daysSinceUnixEpoch});
    const dataCategory = this.isResting ? 'resting' : 'active';
    this.heartRateData.rawData[dataCategory].push(newData);
  }

  endWorkout() {
    if (this.workoutInstance) {
      this.isResting = true;
      this.workoutInstance.finishWorkoutRecording();
      const summary = this.workoutInstance.getWorkoutSummary();
      this.storeStepData(summary);
      this.storeData(summary, 'caloriesBurned');
      this.workoutInstance = null;
      return summary;
    } else {
      console.log('There is no workout in progress');
    }
  }

  getMinMaxSteps(nDayPeriod, minOrMax) {
    // TODO: return error if nDayPeriod <= 1
    // nDayPeriod > 1
    // if no step data, return 0
    if (this.stepData.length === 0) {
      return 0;
    } else if (this.stepData.length === 1) {
      return this.stepData[0].steps;
    } else {
      /*
        Summary steps data sample:
        [
          { daysSinceUnixEpoch: 18525, steps: 3484 },
          { daysSinceUnixEpoch: 18526, steps: 2324 }
        ]

        Algorithm:
        2 pointer method over stepsSummary list

      */
      const stepsSummary = this.getStepsSummary();
      let minOrMaxSteps = 0;
      let totalSteps = stepsSummary[0].steps;
      let slowPtr = 0;
      let fastPtr = 1;
      while (fastPtr < stepsSummary.length) {
        const diff = stepsSummary[fastPtr].daysSinceUnixEpoch - stepsSummary[slowPtr].daysSinceUnixEpoch;
        if (diff === nDayPeriod - 1) {
          totalSteps += stepsSummary[fastPtr].steps;
          // enough data collected
          if (!minOrMaxSteps) {
            minOrMaxSteps = totalSteps;
          }
          minOrMaxSteps = Math[minOrMax](minOrMaxSteps, totalSteps);
          slowPtr++;
          fastPtr = slowPtr + 1;
          totalSteps = stepsSummary[slowPtr].steps;
        } else if (diff < nDayPeriod) {
          // collect more steps data
          totalSteps += stepsSummary[fastPtr].steps;
          fastPtr++;
        } else {
          slowPtr++;
          totalSteps = stepsSummary[slowPtr].steps;
          fastPtr = slowPtr + 1;
        }
      }
      return minOrMaxSteps;
    }
  }

  getAverageNumberOfSteps(nDayPeriod) {
    /*
     * 1. track number of complete N day periods
     * 2. store running total of steps for complete N day periods
     * 3. divide number of complete periods by running total
     */
    if (this.stepData.length === 0) {
      return 0;
    } else if (this.stepData.length === 1) {
      return this.stepData[0].steps;
    } else {
      let completeNDayPeriods = 0;
      let totalStepsForCompleteNDayPeriods = 0;

      const stepsSummary = this.getStepsSummary();
      let totalSteps = stepsSummary[0].steps;
      let slowPtr = 0;
      let fastPtr = 1;
      while (fastPtr < stepsSummary.length) {
        const diff = stepsSummary[fastPtr].daysSinceUnixEpoch - stepsSummary[slowPtr].daysSinceUnixEpoch;
        if (diff === nDayPeriod - 1) {
          totalSteps += stepsSummary[fastPtr].steps;
          // enough data collected
          completeNDayPeriods++;
          totalStepsForCompleteNDayPeriods += totalSteps;

          slowPtr++;
          fastPtr = slowPtr + 1;
          totalSteps = stepsSummary[slowPtr].steps;
        } else if (diff < nDayPeriod) {
          // collect more steps data
          totalSteps += stepsSummary[fastPtr].steps;
          fastPtr++;
        } else {
          slowPtr++;
          totalSteps = stepsSummary[slowPtr].steps;
          fastPtr = slowPtr + 1;
        }
      }

      if (completeNDayPeriods === 0) {
        return 0;
      } else {
        return totalStepsForCompleteNDayPeriods / completeNDayPeriods;
      }
    }
  }

  getAverageRestingHeartRate(nDayPeriod) {
    /*
     * N day period > 0
     */
    const heartRateDataList = this.getHeartRateData().rawData.resting;
    if (heartRateDataList.length === 0) {
      return 0;
    } else {
      let lastSeenDaysSinceUnixEpoch = heartRateDataList[0].daysSinceUnixEpoch;
      let countOfNDayPeriods = 1;
      let averageHeartRateData = [];
      let totalHeartRateBpmInNDayPeriod = 0;
      let countOfDataPointsInNDayPeriod = 0;

      heartRateDataList.forEach(heartRateData => {
        if (heartRateData.daysSinceUnixEpoch === lastSeenDaysSinceUnixEpoch) {
          // collect more data
          totalHeartRateBpmInNDayPeriod += heartRateData.heartRate;
          countOfDataPointsInNDayPeriod++;
        } else {
          // bank collected data
          averageHeartRateData.push(totalHeartRateBpmInNDayPeriod / countOfDataPointsInNDayPeriod);

          countOfNDayPeriods++
          // reset
          totalHeartRateBpmInNDayPeriod = 0;
          countOfDataPointsInNDayPeriod = 0;
        }
      });
      // bank last set of data
      if (countOfDataPointsInNDayPeriod) {
        averageHeartRateData.push(totalHeartRateBpmInNDayPeriod / countOfDataPointsInNDayPeriod);
      }
      return averageHeartRateData.reduce((acc, cur, curIndex, arr) => {
        acc += cur;
        if (curIndex === arr.length - 1) {
          acc = acc / arr.length;
        }
        return acc;
      }, 0);
    }
  }

  getAverageCaloriesBurnedPerWorkout(nDayPeriod, workoutType) {
    /*
     * N day period > 0
     */
    const caloriesBurnedDataList = this.getDataSummary('caloriesBurned')
      .filter(data => data.workoutType === workoutType);

    let completeNDayPeriods = 0;
    let totalCaloriesBurnedForCompleteNDayPeriods = 0;

    let totalCaloriesBurned = caloriesBurnedDataList[0].caloriesBurned;
    let countOfDataPointsInNDayPeriod = 1;
    let slowPtr = 0;
    let fastPtr = 1;
    while (fastPtr < caloriesBurnedDataList.length) {
      const diff = caloriesBurnedDataList[fastPtr].daysSinceUnixEpoch - caloriesBurnedDataList[slowPtr].daysSinceUnixEpoch;
      if (diff === nDayPeriod - 1) {
        totalCaloriesBurned += caloriesBurnedDataList[fastPtr].caloriesBurned;
        // enough data collected
        completeNDayPeriods++;
        totalCaloriesBurnedForCompleteNDayPeriods += totalCaloriesBurned;

        slowPtr++;
        fastPtr = slowPtr + 1;
        totalCaloriesBurned = caloriesBurnedDataList[slowPtr].caloriesBurned;
      } else if (diff < nDayPeriod) {
        // collect more data
        totalCaloriesBurned += caloriesBurnedDataList[fastPtr].caloriesBurned;
        countOfDataPointsInNDayPeriod++;
        fastPtr++;
      } else {
        slowPtr++;
        totalCaloriesBurned = caloriesBurnedDataList[slowPtr].caloriesBurned;
        fastPtr = slowPtr + 1;
      }
    }

    if (completeNDayPeriods === 0) {
      return 0;
    } else {
      return totalCaloriesBurnedForCompleteNDayPeriods / countOfDataPointsInNDayPeriod;
    }
  }
}

module.exports = Wearer;
