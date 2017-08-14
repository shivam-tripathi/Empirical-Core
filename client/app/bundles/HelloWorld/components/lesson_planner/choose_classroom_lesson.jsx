import React from 'react';
import request from 'request';

export default class ChooseClassroomLesson extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      activityName: '',
      classroomActivities: []
    }

    this.getClassroomLessonInfo()
    this.getHasViewedLessonTutorialInfo()

    this.launchLesson = this.launchLesson.bind(this)
    this.goBack = this.goBack.bind(this)
  }

  getClassroomLessonInfo() {
    console.log('default url', process.env.DEFAULT_URL)
    request.get(`${process.env.DEFAULT_URL}/teachers/units/${this.props.params.unitId}/activities/${this.props.params.activityId}`, (error, httpStatus, body) => {
      console.log('error', error)
      console.log('httpStatus', httpStatus)
      console.log('body', body)
      const data = JSON.parse(body)
      this.setState({
        classroomActivities: data.classroom_activities,
        activityName: data.activity_name,
        loading: false
      })
    })
  }

  getHasViewedLessonTutorialInfo() {
    request.get(`${process.env.DEFAULT_URL}/milestones/has_viewed_lesson_tutorial`, (error, httpStatus, body) => {
      const completed = JSON.parse(body).completed
      this.setState({hasViewedLessonTutorial: completed})
    })
  }


  renderClasses() {
    const classrooms = this.state.classroomActivities.map((ca, i) =>
      this.renderClassroomRow(ca, i)
    )
    return <div>{classrooms}</div>
  }

  renderClassroomRow(ca, i) {
    const numberOfStudents = `${ca.number_of_assigned_students} student${ca.number_of_assigned_students === 1 ? '' : 's'}`
    const selectedClassName = ca.id === this.state.selectedClassroomActivityId ? 'selected' : null
    let completionText, completionClass, imgName, clickFunction
    if (ca.completed) {
      completionText = <span className="completed-text"><i className="fa fa-check-circle" /> Lesson Completed*</span>
      completionClass = 'completed'
      imgName = "radio_button_light_gray"
    } else {
      completionText = <span/>
      completionClass = 'incomplete'
      imgName = selectedClassName ? "radio_button_selected" : "radio_button_empty"
      clickFunction = () => {this.setSelectedClassroomActivityId(ca.id)}
    }
    return <div key={i} onClick={clickFunction} className={`classroom-row ${selectedClassName} ${completionClass}`}>
      <div>
        <img src={`${process.env.CDN_URL}/images/shared/${imgName}.svg`}/>
        <span>{ca.classroom_name}</span> ({numberOfStudents})
      </div>
      {completionText}
    </div>
  }

  setSelectedClassroomActivityId(id) {
    this.setState({selectedClassroomActivityId: id})
  }

  launchLesson() {
    const classroomActivityId = this.state.selectedClassroomActivityId
    const lessonId = this.props.routeParams.activityId
    request.put({
      url: `${process.env.DEFAULT_URL}/teachers/classroom_activities/${classroomActivityId}/unlock_lesson`,
      json: {authenticity_token: $('meta[name=csrf-token]').attr('content')}
     }, (error, httpStatus, body) => {
      if (body.unlocked) {
				const lessonUrl = `http://connect.quill.org/#/teach/class-lessons/${lessonId}?&classroom_activity_id=${classroomActivityId}`
				if (this.state.hasViewedLessonTutorial) {
					window.location = lessonUrl
				} else {
					window.location = `${process.env.DEFAULT_URL}/tutorials/lessons?url=${encodeURIComponent(lessonUrl)}`
				}
			}
    })
  }

  goBack() {
    this.props.history.goBack()
  }

  render() {
    const buttonClass = this.state.selectedClassroomActivityId ? 'bg-quillgreen' : ''
    return(
    <div className='choose-classroom-lessons container'>
      <div className='lesson-section'>
        <p>You've selected this lesson to launch:</p>
        <div className="lesson-row">
          <img src={`${process.env.CDN_URL}/images/shared/icon-lesson-box.svg`}/>
          <p>{this.state.activityName}</p>
          <span onClick={this.goBack}>Undo Selection</span>
        </div>
      </div>

      <div className='class-section'>
        <h3>Now, choose a class to launch this lesson:</h3>
        {this.renderClasses()}
      </div>
      <div className="bottom-section">
        {/* we will use the text below when we have a lessons page to send teachers to */}
        {/* <p>*To re-do a completed lesson with your students, you can re-assign the lesson to the class and launch it. To re-assign a lesson, you can click here.</p> */}
        <p>*To re-do a completed lesson with your students, you can re-assign the lesson to the class and launch it.</p>
        <button onClick={this.launchLesson} className={`q-button text-white ${buttonClass}`}>Launch Lesson</button>
      </div>
    </div>)
  }
}
