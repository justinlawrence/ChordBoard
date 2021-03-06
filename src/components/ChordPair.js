import React from 'react'
import cx from 'classnames'

import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
	text: {
		display: 'inline-block',
		lineHeight: 1.5,
		marginTop: '1em',
		minHeight: theme.spacing(1),
		position: 'relative',
		verticalAlign: 'middle',
		whiteSpace: 'pre-wrap',

		'&:before': {
			color: '#03a9f4',
			content: 'attr(data-content)',
			fontSize: '.8em',
			fontWeight: '600',
			position: 'absolute',
			top: '-1em',
		},
	},
	textEmpty: {
		marginLeft: '.75em',
		minWidth: '2em',
	},
})

const ChordPair = ({ chords, chordSize, classes, text, wordSize }) => {
	const children = []

	chords._sort.forEach((index, i) => {
		const nextIndex = chords._sort[i + 1] || Infinity
		let slice = text.slice(index, nextIndex)

		children.push(
			<span
				key={i}
				className={cx(classes.text, {
					[classes.textEmpty]: !slice.trim(),
				})}
				data-content={chords[index]}
			>
				{slice}
			</span>
		)
	})

	return <div style={{ fontSize: `${wordSize}px` }}>{children}</div>
}

export default withStyles(styles)(ChordPair)
