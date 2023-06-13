import React from 'react'
import { Redirect } from 'react-router-dom'

import ATMWallet from 'src/pages/ATMWallet/ATMWallet'
import Accounting from 'src/pages/Accounting/Accounting'
import Analytics from 'src/pages/Analytics/Analytics'
import Assets from 'src/pages/Assets/Assets'
import Blacklist from 'src/pages/Blacklist'
import Cashout from 'src/pages/Cashout'
import Commissions from 'src/pages/Commissions'
import { Customers, CustomerProfile } from 'src/pages/Customers'
import Locales from 'src/pages/Locales'
import IndividualDiscounts from 'src/pages/LoyaltyPanel/IndividualDiscounts'
import PromoCodes from 'src/pages/LoyaltyPanel/PromoCodes'
import MachineLogs from 'src/pages/MachineLogs'
import CashUnits from 'src/pages/Maintenance/CashUnits'
import MachineStatus from 'src/pages/Maintenance/MachineStatus'
import {
  Notifications,
  SetupAndTransactions,
  FiatBalance,
  CryptoBalance
} from 'src/pages/Notifications/Notifications'
import CoinAtmRadar from 'src/pages/OperatorInfo/CoinATMRadar'
import ContactInfo from 'src/pages/OperatorInfo/ContactInfo'
import ReceiptPrinting from 'src/pages/OperatorInfo/ReceiptPrinting'
import SMSNotices from 'src/pages/OperatorInfo/SMSNotices/SMSNotices'
import TermsConditions from 'src/pages/OperatorInfo/TermsConditions'
import ServerLogs from 'src/pages/ServerLogs'
import SessionManagement from 'src/pages/SessionManagement/SessionManagement'
import Transactions from 'src/pages/Transactions/Transactions'
import Triggers from 'src/pages/Triggers'
import UserManagement from 'src/pages/UserManagement/UserManagement'
import { namespaces } from 'src/utils/config'

import { ROLES } from './utils'

const getPazuzRoutes = () => [
  {
    key: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    component: Transactions
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    route: '/maintenance',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'cash_units',
        label: 'Cash Units',
        route: '/maintenance/cash-units',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CashUnits
      },
      {
        key: 'logs',
        label: 'Machine Logs',
        route: '/maintenance/logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineLogs
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineStatus
      },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: ServerLogs
      }
    ]
  },
  {
    key: 'analytics',
    label: 'Analytics',
    route: '/analytics',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    component: Analytics
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: namespaces.COMMISSIONS,
        label: 'Commissions',
        route: '/settings/commissions',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Commissions
      },
      {
        key: namespaces.LOCALE,
        label: 'Locales',
        route: '/settings/locale',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Locales
      },
      {
        key: namespaces.CASH_OUT,
        label: 'Cash-out',
        route: '/settings/cash-out',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Cashout
      },
      {
        key: namespaces.NOTIFICATIONS,
        label: 'Notifications',
        route: '/settings/notifications',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => (
            <Notifications>
              <Redirect
                to={{
                  pathname: this.children[0].route,
                  state: { prev: this.state?.prev }
                }}
              />
            </Notifications>
          )
        },
        children: [
          {
            key: 'setup-tx-alerts',
            label: 'Setup & Transaction Alerts',
            route: '/settings/notifications/setup-tx-alerts',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: SetupAndTransactions
          },
          {
            key: 'fiat-alerts',
            label: 'Fiat Balance Alerts',
            route: '/settings/notifications/fiat-alerts',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: FiatBalance
          },
          {
            key: 'crypto-alerts',
            label: 'Crypto Balance Alerts',
            route: '/settings/notifications/crypto-alerts',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: CryptoBalance
          }
        ]
      },
      {
        key: namespaces.OPERATOR_INFO,
        label: 'Operator Info',
        route: '/settings/operator-info',
        title: 'Operator Information',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => (
            <Redirect
              to={{
                pathname: this.children[0].route,
                state: { prev: this.state?.prev }
              }}
            />
          )
        },
        children: [
          {
            key: 'contact-info',
            label: 'Contact information',
            route: '/settings/operator-info/contact-info',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ContactInfo
          },
          {
            key: 'receipt-printing',
            label: 'Receipt',
            route: '/settings/operator-info/receipt-printing',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ReceiptPrinting
          },
          {
            key: 'sms-notices',
            label: 'SMS notices',
            route: '/settings/operator-info/sms-notices',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: SMSNotices
          },
          {
            key: 'coin-atm-radar',
            label: 'Coin ATM Radar',
            route: '/settings/operator-info/coin-atm-radar',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: CoinAtmRadar
          },
          {
            key: 'terms-conditions',
            label: 'Terms & Conditions',
            route: '/settings/operator-info/terms-conditions',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: TermsConditions
          }
        ]
      }
    ]
  },
  {
    key: 'compliance',
    label: 'Compliance',
    route: '/compliance',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'triggers',
        label: 'Triggers',
        route: '/compliance/triggers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Triggers
      },
      {
        key: 'customers',
        label: 'Customers',
        route: '/compliance/customers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Customers
      },
      {
        key: 'blacklist',
        label: 'Blacklist',
        route: '/compliance/blacklist',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Blacklist
      },
      {
        key: 'loyalty',
        label: 'Loyalty',
        route: '/compliance/loyalty',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => (
            <Redirect
              to={{
                pathname: this.children[0].route,
                state: { prev: this.state?.prev }
              }}
            />
          )
        },
        children: [
          {
            key: 'individual-discounts',
            label: 'Individual Discounts',
            route: '/compliance/loyalty/individual-discounts',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: IndividualDiscounts
          },
          {
            key: 'promo-codes',
            label: 'Promo Codes',
            route: '/compliance/loyalty/codes',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: PromoCodes
          }
        ]
      },
      {
        key: 'customer',
        route: '/compliance/customer/:id',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CustomerProfile
      }
    ]
  },
  {
    key: 'accounting',
    label: 'Accounting',
    route: '/accounting',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'accountingpage',
        label: 'Accounting',
        route: '/accounting/accounting',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Accounting
      },
      {
        key: 'atmwallets',
        label: 'ATM Wallets',
        route: '/accounting/wallets',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: ATMWallet
      },
      {
        key: 'assetspage',
        label: 'Assets',
        route: '/accounting/assets',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Assets
      }
    ]
  },
  {
    key: 'system',
    label: 'System',
    route: '/system',
    allowedRoles: [ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'user-management',
        label: 'User Management',
        route: '/system/user-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: UserManagement
      },
      {
        key: 'session-management',
        label: 'Session Management',
        route: '/system/session-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: SessionManagement
      }
    ]
  }
]

export default getPazuzRoutes
