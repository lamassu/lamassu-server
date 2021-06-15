import { offDarkColor, tomato } from 'src/styling/variables'

const styles = {
  overviewLegend: {
    display: 'flex',
    justifyContent: 'flex-end',
    '& span': {
      marginRight: 24
    },
    '& > :last-child': {
      marginRight: 0
    }
  },
  legendEntry: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > :first-child': {
      marginRight: 8
    }
  },
  dropdownsOverviewWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  verticalLine: {
    height: 64,
    width: 1,
    border: 'solid',
    borderWidth: 0.5,
    borderColor: offDarkColor
  },
  dropdowns: {
    display: 'flex',
    flexDirection: 'row',
    '& div': {
      marginRight: 24
    },
    '& > :last-child': {
      marginRight: 0
    }
  },
  overview: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& div': {
      marginRight: 40
    },
    '& > :last-child': {
      marginRight: 0
    }
  },
  overviewFieldWrapper: {
    marginTop: 6,
    marginBottom: 6,
    '& span': {
      fontSize: 24
    }
  },
  overviewGrowth: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& p': {
      marginLeft: 10
    }
  },
  growth: {
    color: '#00CD5A'
  },
  decline: {
    color: tomato
  },
  // Graph
  graphHeaderWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  graphHeaderLeft: {
    display: 'flex',
    flexDirection: 'column'
  },
  graphHeaderRight: {
    marginTop: 15
  },
  graphLegend: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& span': {
      marginRight: 24
    },
    '& > :last-child': {
      marginRight: 0
    }
  },
  machineSelector: {
    width: 248
  }
}

export default styles
