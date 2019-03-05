import { h, Component} from 'preact'
import PhoneNumber, {isValidPhoneNumber} from 'react-phone-number-input'

import classNames from 'classnames';
import {localised} from '../../locales'


import 'react-phone-number-input/rrui.css'
import 'react-phone-number-input/style.css'
import style from './style.css'

const FlagComponent = ({ countryCode, flagsPath }) => (
  <span
    className={ classNames('react-phone-number-input__icon', style.flagIcon) }
    style={{
      'background-image': `url(${ flagsPath }${ countryCode.toLowerCase() }.svg)`,
    }}
  />
);

class PhoneNumberInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      validPreDefinedNumber: false,
    }
  }

  componentDidMount() {
    const smsProps = this.props.sms
    if (smsProps && smsProps.number) {
      this.setState({validPreDefinedNumber: isValidPhoneNumber(smsProps.number)})
    }
  }

  onChange = (number) => {
    const { clearErrors, actions } = this.props
    clearErrors()
    const valid = isValidPhoneNumber(number)
    actions.setMobileNumber(number, valid)
  }

  preDefinedNumber = () => this.state.validPreDefinedNumber ? this.props.sms.number : ''

  render() {
    const { translate, smsNumberCountryCode } = this.props
    return (
      <form onSubmit={(e) => e.preventDefault()}>
        <PhoneNumber placeholder={translate('cross_device.phone_number_placeholder')}
          value={this.preDefinedNumber()}
          onChange={this.onChange}
          country={smsNumberCountryCode}
          inputClassName={`${style.mobileInput}`}
          className={`${style.phoneNumberContainer}`}
          flagComponent={ FlagComponent }
        />
      </form>
    )
  }
}

export default localised(PhoneNumberInput)
