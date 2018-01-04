// The progress report showing all students in a given classroom
// along with their result counts.
import React from 'react'
import request from 'request'
import CSVDownloadForProgressReport from './csv_download_for_progress_report.jsx'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import {sortByLastName} from '../../../../modules/sortingMethods.js'
import LoadingSpinner from '../shared/loading_indicator.jsx'
import ItemDropdown from '../general_components/dropdown_selectors/item_dropdown'
import userIsPremium from '../modules/user_is_premium'

const showAllClassroomKey = 'All Classrooms'

export default class extends React.Component {

  constructor(props) {
    super()
    this.state = {
      loading: true,
      errors: false,
      selectedClassroom: showAllClassroomKey,
      userIsPremium: userIsPremium()
    }
    this.switchClassrooms = this.switchClassrooms.bind(this)
  }

  componentDidMount() {
    const that = this;
    request.get({
      url: `${process.env.DEFAULT_URL}/${this.props.sourceUrl}`
    }, (e, r, body) => {
      const data = JSON.parse(body)
      const parsedClassrooms = this.parseClassrooms(data.classrooms_with_student_ids)
      const dropdownClassrooms = parsedClassrooms.dropdownClassrooms;
      const classroomsWithStudentIds = parsedClassrooms.classroomsWithStudentIds
      that.setState({loading: false, errors: body.errors, reportData: data.students, filteredReportData: data.students, dropdownClassrooms, classroomsWithStudentIds});
    });
  }

  parseClassrooms(classrooms){
    const classroomsWithStudentIds = {}
    const dropdownClassrooms = [{id: showAllClassroomKey, name: showAllClassroomKey}];
    classrooms.forEach((c)=>{
      classroomsWithStudentIds[c.id] = c.student_ids;
      dropdownClassrooms.push({id: c.id, name: c.name})
    })
    return {dropdownClassrooms, classroomsWithStudentIds }
  }

  switchClassrooms(classroom){
    this.setState({selectedClassroom: classroom}, this.filterReportData)
  }

  filterReportData(){
    if (this.state.selectedClassroom.id === showAllClassroomKey) {
      this.setState({filteredReportData: this.state.reportData})
    } else {
      const validStudentIds = this.state.classroomsWithStudentIds[this.state.selectedClassroom.id]
      const filteredReportData = this.state.reportData.filter((student)=> validStudentIds.includes(student.id))
      this.setState({filteredReportData})
    }
  }

  columns() {
    const blurIfNotPremium = this.state.userIsPremium ? null : 'non-premium-blur'
    return ([
      {
        Header: 'Student',
        accessor: 'name',
        resizable: false,
        sortMethod: sortByLastName,
        Cell: row => (
          <a href={row.original['concepts_href']}>{row.original['name']}</a>
        )
      }, {
        Header: 'Questions',
        accessor: 'total_result_count',
        resizable: false,
        Cell: row => (
          <a className="row-link-disguise" href={row.original['concepts_href']}>{row.original['total_result_count']}</a>
        )
      }, {
        Header: 'Correct',
        accessor: 'correct_result_count',
        className: blurIfNotPremium,
        resizable: false,
        Cell: row => (
          <a className="row-link-disguise" href={row.original['concepts_href']}>{row.original['correct_result_count']}</a>
        )
      }, {
        Header: 'Incorrect',
        accessor: 'incorrect_result_count',
        className: blurIfNotPremium,
        resizable: false,
        Cell: row => (
          <a className="row-link-disguise" href={row.original['concepts_href']}>{row.original['incorrect_result_count']}</a>
        )
      }, {
        Header: 'Percentage',
        accessor: 'percentage',
        resizable: false,
        className: blurIfNotPremium,
        Cell: row => (
          <a className="row-link-disguise" href={row.original['concepts_href']}>{row.original['percentage']}%</a>
        )
      }, {
        Header: "",
        accessor: 'green_arrow',
        resizable: false,
        sortable: false,
        width: 80,
        Cell: row => (
          <a className='green-arrow' href={row.original['concepts_href']}>
            <img src="https://assets.quill.org/images/icons/chevron-dark-green.svg" alt=""/>
          </a>
        )
      }
    ])
  }

  render() {
    if (this.state.loading || !this.state.reportData) {
      return <LoadingSpinner/>
    }
    return (
      <div className='progress-reports-2018'>
        <div className="meta-overview flex-row space-between">
          <div className='header-and-info'>
            <h1>Concept Results</h1>
            <p>Each time a student correctly demonstrates a concept or creates an error, Quill generates a concept result. This report provides an aggregate picture of student progress on each concept.</p>
          </div>
          <div className='csv-and-how-we-grade'>
            <CSVDownloadForProgressReport data={this.state.filteredReportData}/>
            <a className='how-we-grade' href="https://support.quill.org/activities-implementation/how-does-grading-work">How We Grade<i className="fa fa-long-arrow-right"></i></a>
          </div>
          <div className='dropdown-container'>
            <ItemDropdown items={this.state.dropdownClassrooms} callback={this.switchClassrooms} selectedItem={this.state.selectedClassroom}/>
          </div>
        </div>
        <div key={`concept-progress-report-length-${this.state.filteredReportData.length}`}>
          <ReactTable data={this.state.filteredReportData} columns={this.columns()} showPagination={false} defaultSorted={[{
              id: 'total_result_count',
              desc: true
            }
          ]} showPaginationTop={false} showPaginationBottom={false} showPageSizeOptions={false} defaultPageSize={this.state.filteredReportData.length} className='progress-report has-green-arrow'/>
        </div>
      </div>
    )
  }

};
