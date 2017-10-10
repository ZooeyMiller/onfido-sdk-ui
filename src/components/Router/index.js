import { h, Component } from 'preact'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import io from 'socket.io-client'
import createHistory from 'history/createBrowserHistory'

import { componentsList } from './StepComponentMap'
import StepsRouter from './StepsRouter'
import Spinner from '../Spinner'
import { unboundActions, events } from '../../core'
import { isDesktop } from '../utils'


const history = createHistory()

const Router = (props) =>{
  const RouterComponent = props.options.mobileFlow ? CrossDeviceMobileRouter : MainRouter
  return <RouterComponent {...props} allowCrossDeviceFlow={!props.options.mobileFlow && isDesktop}/>
}


class CrossDeviceMobileRouter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      token: null,
      steps: null,
      step: null,
      socket: io(process.env.DESKTOP_SYNC_URL),
      roomId: window.location.pathname.substring(3),
    }
    this.state.socket.on('config', this.setConfig(props.actions))
    this.state.socket.emit('join', {roomId: this.state.roomId})
    this.requestConfig()

    events.on('clientSuccess', this.sendClientSuccess)
  }

  requestConfig = () => {
    this.state.socket.emit('message', {roomId: this.state.roomId, event: 'get config'})
  }

  setConfig = (actions) => (data) => {
    const {token, steps, documentType, step} = data
    this.setState({token, steps, step})
    actions.setDocumentType(documentType)
  }

  onStepChange = ({step}) => {
    this.setState({step})
  }

  sendClientSuccess = () => {
    this.state.socket.emit('message', {roomId: this.state.roomId, event: 'clientSuccess'})
  }

  render = (props) =>
      this.state.token ?
        <HistoryRouter {...props} {...this.state}
          steps={this.state.steps}
          step={this.state.step}
          onStepChange={this.onStepChange}
        /> : <Spinner />
}


class MainRouter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mobileInitialStep: null,
    }
  }

  mobileConfig = () => {
    const {documentType, options} = this.props
    const {steps, token} = options
    return {steps, token, documentType, step: this.state.mobileInitialStep}
  }

  onFlowChange = (newFlow, newStep, previousFlow, previousStep) => {
    if (newFlow === "crossDeviceSteps") this.setState({mobileInitialStep: previousStep})
  }

  render = (props) =>
    <HistoryRouter {...props}
      steps={props.options.steps}
      onFlowChange={this.onFlowChange}
      mobileConfig={this.mobileConfig()}
    />
}

class HistoryRouter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      flow: 'captureSteps',
      step: this.props.step || 0,
    }
    this.unlisten = history.listen(this.onHistoryChange)
    this.setStepIndex(this.state.step, this.state.flow)
  }

  onHistoryChange = ({state:historyState}) => {
    this.props.onStepChange(historyState)
    this.setState({...historyState})
  }

  componentWillUnmount () {
    this.unlisten()
  }

  changeFlowTo = (newFlow, newStep=0) => {
    const {flow: previousFlow, step: previousStep} = this.state
    if (previousFlow === newFlow) return
    this.props.onFlowChange(newFlow, newStep, previousFlow, previousStep)
    this.setStepIndex(newStep, newFlow)
  }

  nextStep = () => {
    const {step: currentStep} = this.state
    const isMobileFlow = this.props.options.mobileFlow
    const componentsList = this.componentsList()
    const newStepIndex = currentStep + 1
    if (componentsList.length === newStepIndex && isMobileFlow) {
      events.emit('clientSuccess')
      return
    }
    if (componentsList.length === newStepIndex && !isMobileFlow){
      events.emit('complete')
    }
    else {
      this.setStepIndex(newStepIndex)
    }
  }

  previousStep = () => {
    const {step: currentStep} = this.state
    this.setStepIndex(currentStep - 1)
  }

  back = () => {
    history.goBack()
  }

  setStepIndex = (newStepIndex, newFlow) => {
    const {flow:currentFlow} = this.state
    const historyState = {
      step: newStepIndex,
      flow: newFlow || currentFlow,
    }
    const path = `${location.pathname}${location.search}${location.hash}`
    history.push(path, historyState)
  }

  componentsList = () => this.buildComponentsList(this.state, this.props)
  buildComponentsList = ({flow}, {documentType, steps, options: {mobileFlow}}) =>
    componentsList({flow, documentType, steps, mobileFlow});

  render = (props) =>
      <StepsRouter {...props}
        componentsList={this.componentsList()}
        step={this.state.step}
        changeFlowTo={this.changeFlowTo}
        nextStep={this.nextStep}
        previousStep={this.previousStep}
        back={this.back}
      />;
}

HistoryRouter.defaultProps = {
  onStepChange: ()=>{},
  onFlowChange: ()=>{}
}

function mapStateToProps(state) {
  return {...state.globals}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(unboundActions, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(Router)
