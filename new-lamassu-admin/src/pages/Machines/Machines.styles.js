import { spacer, comet } from 'src/styling/variables'

const styles = {
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginLeft: spacer * 6,
    maxWidth: 900
  },
  subtitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    color: comet
  },
  label3: {
    color: comet,
    marginTop: 0
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  rowItem: {
    flex: 1,
    marginBottom: spacer * 2
  },
  detailItem: {
    marginBottom: spacer * 4
  },
  actionButtonsContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  breadcrumbsContainer: {
    marginTop: 32
  },
  breadcrumbLink: {
    textDecoration: 'none'
  },
  detailsMargin: {
    marginTop: 24
  },
  sidebarContainer: {
    height: 400,
    overflowY: 'auto'
  }
}

export default styles
