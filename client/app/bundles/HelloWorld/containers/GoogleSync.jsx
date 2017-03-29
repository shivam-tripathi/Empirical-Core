import React from 'react'
import $ from 'jquery'
import LoadingIndicator from '../components/shared/loading_indicator.jsx'
import GoogleClassroomList from '../components/google_classroom/google_classroom_sync/GoogleClassroomsList.jsx'
import ArchiveClassesWarning from '../components/google_classroom/google_classroom_sync/ArchiveClassesWarning.jsx'
import SyncSuccessModal from '../components/google_classroom/google_classroom_sync/SyncSuccessModal.jsx'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import {authForGoogleSyncPage} from '../components/modules/google_authentication.js'
import Modal from 'react-bootstrap/lib/Modal'

export default class extends React.Component{
  constructor(){
    super()
    this.hideModal = this.hideModal.bind(this);
    this.hideSuccessModal = this.hideSuccessModal.bind(this);
    this.syncClassrooms = this.syncClassrooms.bind(this);
    this.syncClassroomsAjax = this.syncClassroomsAjax.bind(this);
  }

  state = {loading: true}

  componentDidMount(){
    this.getGoogleClassrooms()
  }

  getGoogleClassrooms(){
    const that = this;
    $.get('/teachers/classrooms/retrieve_google_classrooms', (data) => {
      if (data.errors === 'UNAUTHENTICATED') {
        authForGoogleSyncPage();
      }
      that.setState({classrooms: data.classrooms})
    })
    .fail((data)=>{
      that.setState({error: data.errors})
    })
    .always(()=>{
      that.setState({loading: false})
    })
    ;
  }

  loadingIndicatorOrContent(){
    if (this.state.loading) {
      return <LoadingIndicator/>
    } else if (this.state.errors) {
      return <div>Google has returned the following error</div>
    } else {
      return this.content()
    }
  }

  syncClassroomsAjax() {
    const that = this
    const selectedClassrooms = JSON.stringify(this.state.classData.selectedClassrooms)
    $.ajax({
      type: 'post',
      data: {selected_classrooms: selectedClassrooms},
      url: '/teachers/classrooms/update_google_classrooms',
      statusCode: {
        200: function() {
          that.syncClassroomSuccess()
          }
      }
    })
  }

  syncClassrooms = (classData) => {
    this.setState(
      {classData},
      ()=>(this.modalWarning())
    )
  }

  modalWarning = () => {
    if (this.state.classData.archivedCount > 0) {
      this.setState({showModal: true})
    } else {
      this.syncClassroomsAjax();
    }
  }

  hideModal() {
    this.setState({showModal: false})
  }

  hideSuccessModal() {
    this.setState({showSuccessModal: false})
  }

  syncClassroomSuccess = () => {
    const that = this;
    $.ajax({
      type: 'get',
      url: '/teachers/classrooms/import_google_students',
      statusCode: {
        200: function() {
          that.setState({showSuccessModal: true})
        }
      }
    })
  }

  content(){
    return (
      <div className='google-sync'>
        <h2>Choose Which Google Classrooms To Sync</h2>
        <p>Select all of the classes that you would like to sync with Google Classroom. Previously connected classes will import new students.</p>
        <GoogleClassroomList classrooms={this.state.classrooms} syncClassrooms={this.syncClassrooms}/>
        <ArchiveClassesWarning show={this.state.showModal} data={this.state.classData} syncClassroomsAjax={this.syncClassroomsAjax} hideModal={this.hideModal} />
        <SyncSuccessModal show={this.state.showSuccessModal} data={this.state.classData} syncClassroomsAjax={this.syncClassroomsAjax} hideModal={this.hideSuccessModal} />
      </div>
    )
  }

  render(){
    return(
      <div className='google-sync-container'>
        {this.loadingIndicatorOrContent()}
      </div>)
  }
}
