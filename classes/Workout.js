class Workout {
  constructor(simulatedWatchData) {
    this.workoutId = null;
    this.workoutType = null;
    this.startTime = null;
    this.endTime = null;
    this.caloriesBurned = 0;
    this.steps = 0;
    this.simulatedWatchData = simulatedWatchData;

    this.startWorkoutRecording();
    this.processSimulatedData();
  }

  addCaloriesBurned(caloriesData) {
    this.caloriesBurned += caloriesData.additionalCaloriesBurned;
  }

  addSteps(stepsData) {
    this.steps += stepsData.additionalSteps;
  }

  startWorkoutRecording(watchData) {
    const data = watchData || this.simulatedWatchData;
    this.workoutType = data.workoutType;
    this.startTime = data.startTime;
  }

  processSimulatedData() {
    const {caloriesBurnedData, stepsData, heartRateData} = this.simulatedWatchData;
    if (caloriesBurnedData) {
      caloriesBurnedData.forEach(calories => {
        this.addCaloriesBurned({additionalCaloriesBurned: calories});
      });
    }
    if (stepsData) {
      stepsData.forEach(steps => {
        this.addSteps({additionalSteps: steps});
      });
    }
  }

  finishWorkoutRecording(watchData) {
    const data = watchData || this.simulatedWatchData;
    this.workoutId = data.workoutId;
    this.endTime = data.endTime;
  }

  getWorkoutSummary() {
    return {
      workoutId: this.workoutId,
      workoutType: this.workoutType,
      startTime: this.startTime,
      endTime: this.endTime,
      caloriesBurned: this.caloriesBurned,
      steps: this.steps
    };
  }
}

module.exports = Workout;
