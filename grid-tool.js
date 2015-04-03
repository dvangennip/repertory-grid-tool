/**
 * Repertory Grid Tool
 */

// --- Helper functions ------------------------------------------------------

/**
 * Shorthand for getting a reference to an element by ID
 * Helps if unsure whether variable is ID or reference to Element itself
 */
var $ = function (inId) {
	if (inId instanceof Element) {
		return inId;
	} else if (typeof inId === 'string') {
		return document.getElementById(inId);
	}
	return null; // must have a default return value
};

/**
 * Wrapper function to simplify adding events
 * see: http://remysharp.com/2009/01/07/html5-enabling-script/
 *
 * use: addEvent( el, eventname, fn to call ) // el can be an array of elements
 */
var addEvent = function (el, type, fn) {
	if (el && el.nodeName || el === window) {
		el.addEventListener(type, fn, false);
	} else if (el && el.length) {
		for (var i = 0; i < el.length; i++) {
			addEvent(el[i], type, fn);
		}
	}
};

/**
 * Extends Element to ease working with classes (based on EnyoJS v1)
 */
Element.make = function (_nodeType, _attributes) { // my own concoction
	var nodeType = (_nodeType !== undefined && typeof _nodeType === 'string') ? _nodeType : 'div',
		attr = (_attributes !== undefined && typeof _attributes === 'object') ? _attributes : {},
		el = document.createElement(nodeType),
		key, skey;
	for (key in attr) {
		if (key === 'innerHTML')
			el.innerHTML = attr[key];
		else if (key === 'events' && typeof attr[key] === 'object')
			for (skey in attr[key])
				addEvent(el, skey, attr[key][skey]);
		else el.setAttribute(key, attr[key]);
	}
	return el;
};
Element.prototype.setClassName = function(a) {
	this.className = a;
};
Element.prototype.getClassName = function() {
	return this.className || "";
};
Element.prototype.hasClass = function (a) {
	return a && (" " + this.getClassName() + " ").indexOf(" " + a + " ") >= 0;
};
Element.prototype.addClass = function (a) {
	if (a && !this.hasClass(a)) {
		var b = this.getClassName();
		this.setClassName(b + (b ? " " : "") + a);
	}
};
Element.prototype.removeClass = function (a) {
	if (a && this.hasClass(a)) {
		var b = this.getClassName();
		b = (" " + b + " ").replace(" " + a + " ", " ").slice(1, -1), this.setClassName(b);
	}
};
Element.prototype.addRemoveClass = function (a, b) {
	this[b ? "addClass" : "removeClass"](a);
};
Element.prototype.insertAfter = function (newchild) {
	// if no nextSibling is available it returns null
	// newChild will then be appended to the parentNode (essentially after this element)
	this.parentNode.insertBefore(newchild, this.nextSibling);
};

// --- Main functions ----------------------------------------------------------

var GG = {
	init: function () {
		this.gridForm = $('grid_form');
		this.gridSize = $('grid_total_size');
		this.gridSelectionSize = $('grid_select_size');
		this.gridShuffle = $('grid_shuffle');
		this.gridUseSeed = $('grid_use_seed');
		this.gridSeed = $('grid_seed');
		this.gridElements = $('grid_elements');
		this.gridReveal = $('grid_reveal');
		this.participantNumber = $('participant_number');
		this.table = $('grid_overview');
		this.output = $('output');
		this.optionsAreaOpen = true;
		this.toggleButtonText = $('toggle_button_link');
		this.grid = [];
		this.settings = {
			size: 6,
			selectSize: 3,
			elements: [],
			shuffle: false,
			useSeed: false,
			seed: 0,
			revealImmediately: false,
			useStorage: false
		};
		this.ppData = {
			participantNumber: 0,
			grid: [],
			ratings: [],
			labels: []
		};
		
		// add events
		addEvent(this.gridSize,          'change', this.onSizeChange.bind(this));
		addEvent(this.gridSelectionSize, 'change', this.onSizeChange.bind(this));
		addEvent(this.gridShuffle,       'change', this.onShuffleChange.bind(this));
		addEvent(this.gridUseSeed,       'change', this.onShuffleChange.bind(this));
		addEvent(this.gridSeed,          'change', this.onShuffleChange.bind(this));
		addEvent(this.gridReveal,        'change', this.onRevealChange.bind(this));
		addEvent(this.participantNumber, 'change', this.onParticipantChange.bind(this));
		addEvent(this.gridElements,      'change', this.onElementsChange.bind(this));
		addEvent($('grid_options_form'), 'submit', this.onSubmission.bind(this));
		addEvent($('toggle_button'),      'click', this.onToggleOptionsArea.bind(this));

		// initiate some values to align with in-browser data on page refresh
		this.onSizeChange();
		this.onShuffleChange();
		this.onRevealChange();
		this.onParticipantChange();
		this.onElementsChange();
	},

	onSizeChange: function (inEvent) {
		// make sure the selection size <= total size
		// when user updates values
		var maxValue = parseInt(this.gridSize.value);
		this.gridSelectionSize.max = maxValue;

		if (parseInt(this.gridSelectionSize.value) > maxValue)
			this.gridSelectionSize.value = maxValue;

		this.settings.size = maxValue;
		this.settings.selectSize = parseInt(this.gridSelectionSize.value);

		// also update GUI to reflect number of elements needed
		this.gridElements.setAttribute('rows', maxValue);
		this.onElementsChange();
		
		this.onSettingsChange();
	},

	onShuffleChange: function (inEvent) {
		this.settings.shuffle = this.gridShuffle.checked;
		this.settings.useSeed = this.gridUseSeed.checked;
		this.settings.seed = parseInt(this.gridSeed.value);

		if (this.settings.useSeed)
			this.gridSeed.disabled = false;
		else
			this.gridSeed.disabled = true;

		this.onSettingsChange();
	},

	onParticipantChange: function (inEvent) {
		this.ppData.participantNumber = parseInt(this.participantNumber.value);
		this.onDataChange();
	},

	onElementsChange: function (inEvent) {
		this.settings.elements = this.gridElements.value.split('\n');

		// make sure elements list matches at least size
		while (this.settings.elements.length < this.settings.size)
			this.settings.elements.push('');

		// oversized elements list gets if last element has a default name
		while (this.settings.elements.length > this.settings.size) {
			var h = this.settings.elements.length - 1; // index of last element
			if (this.settings.elements[h] === 'Element '+ (h + 1))
				this.settings.elements.pop(); // remove last element of array
			else
				break;
		}

		// replace empty lines with default element names
		for (var i = 0; i < this.settings.size; i++) {
			if (this.settings.elements[i] === '')
				this.settings.elements[i] = 'Element ' + (i+1);
		}

		// make GUI reflect these changes
		this.gridElements.value = this.settings.elements.join('\n');

		this.updateElementsIndicator();
		this.onSettingsChange();
	},

	updateElementsIndicator: function () {
		// updates the little indicator in element textarea label
		var diffValue = this.settings.elements.length - this.settings.size;
		
		if (diffValue === 0)
			diffValue = '';
		else {
			if (diffValue > 0)
				diffValue = '+' + diffValue;
			diffValue = '('+diffValue+')';
		}
		
		$('label_grid_elements').setAttribute('data-txt', diffValue);
	},

	onRevealChange: function (inEvent) {
		this.settings.revealImmediately = this.gridReveal.checked;
		this.onSettingsChange();
	},

	onToggleOptionsArea: function (inEvent, inState) {
		// toggle options area
		if (typeof inState !== 'undefined')
			this.optionsAreaOpen = inState;
		else
			this.optionsAreaOpen = !this.optionsAreaOpen;

		if (!this.optionsAreaOpen) {
			$('options').style.display = 'none';
			$('results').style.display = 'none';
			this.toggleButtonText.innerHTML = 'Options';
		} else {
			$('options').style.display = '';
			$('results').style.display = '';
			this.toggleButtonText.innerHTML = '<strong>X</strong> close';
		}

		if (inEvent)
			inEvent.preventDefault();
	},

	onSubmission: function (inEvent) {
		if (inEvent)
			inEvent.preventDefault();
		
		this.generateGrid();
		
		return false;
	},

	generateGrid: function () {
		var size = this.settings.size,
			selectSize = this.settings.selectSize,
			selectChance = selectSize / size;

		grid = this.generateGridPartial(size, selectSize-1);
		
		// shuffle order if necessary
		if (this.settings.shuffle) {
			// use library for pseudo-random numbers
			// so we can use an integer as seed value and get predictable output
			var m = Math; // default
			if (this.settings.useSeed)
				m = new MersenneTwister(this.settings.seed);

			/**
			 * Function shuffles the order of elements randomly, something
			 * which a bubble-sort algorithm (used by Array.prototype.sort) cannot accomplish.
			 * Implements http://en.wikipedia.org/wiki/Fisher-Yates_shuffle
			 *
			 * It works on an array itself.
			 *
			 * @author: http://stackoverflow.com/a/962890
			*/
			var tmp, currentItem, topItem = grid.length;

			if (topItem) while(--topItem) {
				currentItem = Math.floor(m.random() * (topItem + 1));
				tmp = grid[currentItem];
				grid[currentItem] = grid[topItem];
				grid[topItem] = tmp;
			}
		}
		
		// create output
		this.setGrid(grid);
	},

	generateGridPartial: function (size, numOfChildren) {
		var subGrid = [];

		// generate positions by stepping right
		for (let r = 0; r < size-numOfChildren; r++) {
			// create row with default values
			let row = Array(size);
			for (let c = 0; c < size; c++)
				row[c] = 0;
			
			// assign 1 value to current position
			row[r] = 1;
			

			// handle children as well
			//   a sub function returns all the permutations possible to the right
			//   of the current position.
			//   this means everything before that needs to be put in front of array.
			if (numOfChildren > 0) {
				// get the partial grid rows from children
				let partialGrid = this.generateGridPartial(size-1-r, numOfChildren-1)

				// use the current row up to position r to merge later
				let partialRowFront = row.slice(0,r+1); // shallow copy, sub array
							
				// merge current position with rows of partialGrid
				for (let i = 0; i < partialGrid.length; i++) {
					// concat front part and generated sub/end part
					let partialRow = partialRowFront.slice(0); // shallow copy, full array
					// copy values over (regular concat function didn't behave properly)
					for (let j = 0; j < partialGrid[i].length; j++)
						partialRow.push(partialGrid[i][j]);
													
					// add to current sub grid
					subGrid.push(partialRow);
				}
			} else {
				// only add this configuration to sub grid
				subGrid.push(row);
			}
		}

		// reached the end (no further steps right possible)
		return subGrid;
	},

	setGrid: function (inGrid) {
		this.grid = this.ppData.grid = inGrid;
		
		// make sure ppData labels and ratings reflect size of grid
		this.ppData.labels = [];
		this.ppData.ratings = [];
		for (var i = 0; i< this.ppData.grid.length; i++) {
			this.ppData.labels.push( ['',''] ); // empty 2x1 array
			this.ppData.ratings.push( Array(this.settings.size) ); // 'undefined' Nx1 array
		}
		this.onDataChange();

		this.fillTable();
		this.generateGridForm();
	},

	fillTable: function () {
		// empty existing table
		while (this.table.firstChild) {
			this.table.removeChild(this.table.firstChild);
		}

		// generate elements for the new table
		for (let row in this.grid) {
			//console.log(this.grid[row]);
			let tableRow = document.createElement('tr');
			this.table.appendChild(tableRow);
			
			for (let cell in this.grid[row]) {
				let cellValue = this.grid[row][cell];
				let tableCell = document.createElement('td');
				if (cellValue === 1) {
					tableCell.className = 'cell-filled';
					tableCell.innerHTML = parseInt(cell) + 1;
				}
				tableRow.appendChild(tableCell);
			}
		}
	},

	generateGridForm: function () {
		// remove old grid form
		while (this.gridForm.firstChild) {
			this.gridForm.removeChild(this.gridForm.firstChild);
		}

		// generate row by row
		for (var row in this.ppData.grid) {
			row = parseInt(row);
			var gridRowTable = Element.make('table', {
				'id': row + '-table',
				'events': {
					'click': this.onRowClick.bind(this)
				}
			}),
			gridRowTableRow = Element.make('tr'),
			gridRow = Element.make('li', {
				'id': row + '-rowlist',
				'class': 'flex-container',
				'expanded': false,
				'revealed': false
			}),
			gridRowUpper = Element.make('div', {
				'class': 'flex-container flex-row grid-row',
				'data-number': row + 1
			});

			gridRowTable.appendChild(gridRowTableRow);
			gridRowUpper.appendChild(gridRowTable);
			gridRow.appendChild(gridRowUpper);
			this.gridForm.appendChild(gridRow);
			
			for (var cell in this.ppData.grid[row]) {
				var cellInSelection = this.ppData.grid[row][cell],
					cellRating = this.ppData.ratings[row][cell],
					tableCell = Element.make('td');

				if (this.settings.revealImmediately && cellInSelection === 1)
					tableCell.className = 'cell-filled';

				// set either rating score or nothing
				if (cellRating && !isNaN(cellRating))
					tableCell.innerHTML = cellRating;
				
				gridRowTableRow.appendChild(tableCell);
			}

			// add labels
			var emergentLabel = Element.make('input', {
				'type': 'text',
				'id': row + '-label-em',
				'name': row + '-label-em',
				'class': 'grid-row-label',
				'events': {
					'change': this.onLabelChange.bind(this)
				},
				'value': this.ppData.labels[row][0]
			}),
			implicitLabel = Element.make('input', {
				'type': 'text',
				'id': row + '-label-im',
				'name': row + '-label-im',
				'class': 'grid-row-label',
				'events': {
					'change': this.onLabelChange.bind(this)
				},
				'value': this.ppData.labels[row][1]
			});
			gridRowUpper.insertBefore(emergentLabel, gridRowTable);
			gridRowUpper.appendChild(implicitLabel);

			// add empty list for likert scales
			var ratingsList = Element.make('ul', {
				'id': row + '-ratings-list'
			});
			gridRow.appendChild(ratingsList);
		}
	},

	onRowClick: function (inEvent) {
		var row = inEvent.originalTarget;
		while (row.id.indexOf('rowlist') === -1) {
			row = row.parentElement;
		}
		var rowID = parseInt(row.id),
			list = $(rowID + '-ratings-list');
			expanding = !(row.getAttribute('expanded') === 'true'), // inverse rightaway
			isRevealed = (row.getAttribute('revealed') === 'true');

		// determine goal state
		if (!isRevealed && !this.settings.revealImmediately) {
			// do reveal table cells
			var tableCells = $(rowID + '-table').childNodes[0].childNodes;

			for (var i = 0; i < tableCells.length; i++) {
				if (this.ppData.grid[rowID][i] === 1)
					tableCells[i].addClass('cell-filled');
			}

			// set the data correctly
			row.setAttribute('revealed', true);
		} else {
			// set the state data correctly
			row.setAttribute('expanded', expanding);
				
			// if contracting, remove the likert scale rows
			if (!expanding) {
				// remove old likert scales
				while (list.firstChild) {
					list.removeChild(list.firstChild);
				}
				// re-enable the label inputs
				$(rowID + '-label-em').disabled = false;
				$(rowID + '-label-im').disabled = false;
			}
			// if expanding, generate the likert scale rows
			else {
				// also disable the label inputs
				$(rowID + '-label-em').disabled = true;
				$(rowID + '-label-im').disabled = true;

				// add each scale
				for (var i = 0; i < this.settings.size; i++) {
					var scale = Element.make('li', {
						'id': rowID + '-' + i + '-scale',
						'class': 'flex-container rating-item'
					});
					if (this.ppData.grid[rowID][i] === 1)
						scale.addClass('selected');

					list.appendChild(scale);

					var elementLabel = Element.make('h3', {
						'innerHTML': (this.settings.elements[i] !== undefined) ? this.settings.elements[i] : 'Element ' + (i+1)
					});
					scale.appendChild(elementLabel);

					var field = Element.make('fieldset');
					scale.appendChild(field);

					var emLabel = Element.make('span', {
						'class': 'qlabel',
						'innerHTML': this.ppData.labels[rowID][0]
					}),
					imLabel = Element.make('span', {
						'class': 'qlabel',
						'innerHTML': this.ppData.labels[rowID][1]
					});

					field.appendChild(emLabel);

					// create the radio buttons				
					for (var j = 0; j < 7; j++) {
						// create radio button
						var rbutton = Element.make('input', {
							'type': 'radio',
							'id': rowID + '-' + i + '-' + j + '-radio',
							'name': rowID + '-' + i + '-radio',
							'value': j+1,
							'events': {
								'click': this.onRatingChange.bind(this)
							}
						});

						// only check the radio button that matches a rating (so initialisation matches data)
						// cannot be done as part of make function above (would always select last button)
						if (this.ppData.ratings[rowID][i] && this.ppData.ratings[rowID][i] === (j+1) )
							rbutton.setAttribute('checked', true);

						field.appendChild(rbutton);

						// TEST
						var rLabel = Element.make('label', {
							'for': rowID + '-' + i + '-' + j + '-radio',
							'innerHTML': '<span><span></span></span>' + (j+1)
						});
						field.appendChild(rLabel);
					}

					field.appendChild(imLabel);
				}
			}
		}
	},

	onLabelChange: function (inEvent) {
		// figure out row data
		var row = parseInt(inEvent.target.id),
			isImplicit = (inEvent.target.id.indexOf('im') !== -1) ? 1 : 0;
		// update ppData label for row
		this.ppData.labels[row][isImplicit] = inEvent.target.value;
		
		this.onDataChange();
	},

	onRatingChange: function (inEvent) {
		// figure out which row and which element
		var numbers = inEvent.target.name.split('-'),
			rowID   = parseInt(numbers[0]),
			element = parseInt(numbers[1]),
			value   = parseInt(inEvent.target.value);

		// update table
		var tableRowCells = $(rowID + '-table').childNodes[0].childNodes;
		tableRowCells[element].innerHTML = value;
		
		// update ppData
		this.ppData.ratings[rowID][element] = value;

		this.onDataChange();
	},

	onSettingsChange: function () {
		// save settings to localStorage
		if (this.settings.useStorage && localStorage)
			localStorage.setItem('settings', this.settings);

		this.fillOutput();
	},

	onDataChange: function () {
		// save data to localStorage
		if (this.settings.useStorage && localStorage)
			localStorage.setItem('ppData', this.ppData);

		this.fillOutput();
	},

	fillOutput: function () {
		var out = 'participant,' + this.ppData.participantNumber + '\n';
		out += 'size,' + this.settings.size + ',' + this.settings.selectSize + '\n';
		out += 'seed,' + this.settings.useSeed + ',' + this.settings.seed + ',\n';
		out += ',\n';
		
		// add ratings grid
		out += 'Ratings grid,\n';
		out += ',' + this.settings.elements.join(',') + ',\n';
		for (var row = 0; row < this.ppData.grid.length; row++) {
			out += this.ppData.labels[row][0] + ',' + this.ppData.ratings[row].join(',')
				+ ',' + this.ppData.labels[row][1] + '\n';
		}

		out += ',\n';

		// add selection grid
		out += 'Set selection grid,\n';
		out += ',' + this.settings.elements.join(',') + ',\n';
		for (var row = 0; row < this.ppData.grid.length; row++) {
			out += this.ppData.labels[row][0] + ',' + this.ppData.grid[row].join(',')
				+ ',' + this.ppData.labels[row][1] + '\n';
		}

		// fill textarea
		this.output.value = out;

		// also save to localStorage
		if (this.settings.useStorage && localStorage)
			localStorage.setItem(this.ppData.participantNumber + '-data', out);
	}
};

// --- Initialise --------------------------------------------------------------

/**
 * Wait for whole page to load before setting up.
 * Prevents problems with objects not loaded yet while trying to assign these.
 */
addEvent(window, 'pageshow', function () {
	GG.init();
});