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

/**
 * Additional functionality to Storage to ease working with Object storage.
 * via: http://stackoverflow.com/a/3146971
 */
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

// --- Main functions ----------------------------------------------------------

var GG = {
	init: function () {
		this.gridForm = $('grid_form');
		this.gridSize = $('grid_total_size');
		this.gridSelectionSize = $('grid_select_size');
		this.gridRatingPoints = $('grid_rating_points');
		this.gridShuffle = $('grid_shuffle');
		this.gridUseSeed = $('grid_use_seed');
		this.gridSeed = $('grid_seed');
		this.gridElements = $('grid_elements');
		this.gridReveal = $('grid_reveal');
		this.participantNumber = $('participant_number');
		this.gridOutputSeparator = $('grid_output_separator');
		this.table = $('grid_overview');
		this.demoTable = $('demo_table');
		this.output = $('output');
		this.optionsAreaOpen = true;
		this.toggleButtonText = $('toggle_button_link');
		this.settings = {
			grid: [],
			size: 6,
			selectSize: 3,
			elements: [],
			ratingPoints: 7,
			shuffle: false,
			useSeed: false,
			seed: 0,
			revealImmediately: false,
			separator: ';'
		};
		this.ppData = {
			participantNumber: 0,
			grid: [],
			ratings: [],
			labels: []
		};
		
		// add events
		addEvent(this.gridSize,            'change', this.onSizeChange.bind(this));
		addEvent(this.gridSelectionSize,   'change', this.onSizeChange.bind(this));
		addEvent(this.gridRatingPoints,    'change', this.onRatingPointsChange.bind(this));
		addEvent(this.gridShuffle,         'change', this.onShuffleChange.bind(this));
		addEvent(this.gridUseSeed,         'change', this.onShuffleChange.bind(this));
		addEvent(this.gridSeed,            'change', this.onShuffleChange.bind(this));
		addEvent(this.gridReveal,          'change', this.onRevealChange.bind(this));
		addEvent(this.demoTable,            'click', this.onRevealDemoClick.bind(this));
		addEvent(this.participantNumber,   'change', this.onParticipantChange.bind(this));
		addEvent(this.gridElements,        'change', this.onElementsChange.bind(this));
		addEvent(this.gridElements,       'keydown', this.onElementsChange.bind(this));
		addEvent(this.gridOutputSeparator, 'change', this.onSeparatorChange.bind(this));
		addEvent($('grid_options_form'),   'submit', this.onSubmission.bind(this));
		addEvent($('toggle_button'),        'click', this.onToggleOptionsArea.bind(this));
		addEvent($('link_settings_close'),  'click', this.onToggleOptionsArea.bind(this));

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
		
		this.onGridChange();
		this.onSettingsChange();
	},

	onShuffleChange: function (inEvent) {
		this.settings.shuffle = this.gridShuffle.checked;
		this.settings.useSeed = this.gridUseSeed.checked;
		this.settings.seed = parseInt(this.gridSeed.value);

		if (this.settings.shuffle) {
			this.gridUseSeed.disabled = false;
			this.gridSeed.disabled = !(this.settings.useSeed);
		} else {
			this.gridUseSeed.disabled = true;
			this.gridSeed.disabled = true;
		}

		this.onGridChange();
		this.onSettingsChange();
	},

	onElementsChange: function (inEvent) {
		// for keydown events only adjust counter and exit
		if (inEvent && inEvent.type && inEvent.type === 'keydown') {
			this.updateElementsIndicator( this.gridElements.value.split('\n').length );
			return;
		}

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

		this.updateElementsIndicator(this.settings.elements.length);
		this.onSettingsChange();
	},

	updateElementsIndicator: function (inElementsSize) {
		// updates the little indicator in element textarea label
		var diffValue = inElementsSize - this.settings.size;
		
		if (diffValue === 0)
			diffValue = '';
		else {
			if (diffValue > 0)
				diffValue = '+' + diffValue;
			diffValue = '('+diffValue+')';
		}
		
		$('label_grid_elements').setAttribute('data-txt', diffValue);
	},

	onParticipantChange: function (inEvent) {
		this.ppData.participantNumber = parseInt(this.participantNumber.value);
		this.onDataChange();
	},

	onRatingPointsChange: function (inEvent) {
		this.settings.ratingPoints = parseInt(this.gridRatingPoints.value);
		this.onSettingsChange();
	},

	onRevealChange: function (inEvent) {
		this.settings.revealImmediately = this.gridReveal.checked;

		// reset demo table
		this.fillTable(this.demoTable, 1, true);
		if (this.settings.revealImmediately)
			this.onRevealDemoClick();
		else
			this.demoTable.setAttribute('revealed', false);

		this.onSettingsChange();
	},

	onRevealDemoClick: function (inEvent) {
		this.revealRow(this.grid, this.demoTable, 0);
	},

	onSeparatorChange: function (inEvent) {
		this.settings.separator = inEvent.target.value;
		this.onSettingsChange();
	},

	onSubmission: function (inEvent) {
		if (inEvent)
			inEvent.preventDefault();
		
		this.setGrid( this.generateGrid() );
		
		return false;
	},

	/**
	 * Everytime settings that influence the grid change,
	 * this function should be called to requests a new grid.
	 */
	onGridChange: function (inKeepGrid) {
		if (!inKeepGrid)
			this.settings.grid = this.generateGrid();
		this.fillTable();
		this.onRevealChange();
	},

	setGrid: function (inGrid) {
		this.settings.grid = inGrid || this.settings.grid;
		this.ppData.grid = inGrid || this.settings.grid;
				
		// make sure ppData labels and ratings reflect size of grid
		this.ppData.labels = [];
		this.ppData.ratings = [];
		for (var i = 0; i< this.ppData.grid.length; i++) {
			this.ppData.labels.push( ['',''] ); // empty 2x1 array
			this.ppData.ratings.push( Array(this.settings.size) ); // 'undefined' Nx1 array
		}
		this.onDataChange();
		this.onGridChange(true);

		this.generateGridForm();
	},

	onToggleOptionsArea: function (inEvent, inState) {
		// toggle options area
		if (typeof inState !== 'undefined')
			this.optionsAreaOpen = inState;
		else
			this.optionsAreaOpen = !this.optionsAreaOpen;

		if (!this.optionsAreaOpen) {
			$('settings').style.display = 'none';
			this.toggleButtonText.innerHTML = 'Settings';
		} else {
			$('settings').style.display = '';
			this.toggleButtonText.innerHTML = '<strong>X</strong> close';
		}

		if (inEvent)
			inEvent.preventDefault();
	},

	generateGrid: function () {
		var size = this.settings.size,
			selectSize = this.settings.selectSize;

		grid = this.generateGridPartial(size, selectSize-1);
		
		// shuffle order if necessary
		if (this.settings.shuffle)
			grid = this.shuffleRows(grid);
		
		return grid;
	},

	generateGridPartial: function (size, numOfChildren) {
		var subGrid = [];

		// generate positions by stepping right
		for (var r = 0; r < size-numOfChildren; r++) {
			// create row with default values
			var row = Array(size);
			for (var c = 0; c < size; c++)
				row[c] = 0;
			
			// assign 1 value to current position
			row[r] = 1;
			

			// handle children as well
			//   a sub function returns all the permutations possible to the right
			//   of the current position.
			//   this means everything before that needs to be put in front of array.
			if (numOfChildren > 0) {
				// get the partial grid rows from children
				var partialGrid = this.generateGridPartial(size-1-r, numOfChildren-1)

				// use the current row up to position r to merge later
				var partialRowFront = row.slice(0,r+1); // shallow copy, sub array
							
				// merge current position with rows of partialGrid
				for (var i = 0; i < partialGrid.length; i++) {
					// concat front part and generated sub/end part
					var partialRow = partialRowFront.slice(0); // shallow copy, full array
					// copy values over (regular concat function didn't behave properly)
					for (var j = 0; j < partialGrid[i].length; j++)
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

	/**
	 * Function shuffles the order of elements randomly, something
	 * which a bubble-sort algorithm (used by Array.prototype.sort) cannot accomplish.
	 * Implements http://en.wikipedia.org/wiki/Fisher-Yates_shuffle
	 *
	 * It works on an array itself.
	 *
	 * @author: http://stackoverflow.com/a/962890
	*/
	shuffleRows: function (inGrid) {
		// use library for pseudo-random numbers
		// so we can use an integer as seed value and get predictable output
		var tmp, currentItem, topItem = inGrid.length,
			m = Math; // default

		// when using seed values another pseudo-random number generator is needed
		if (this.settings.useSeed)
			m = new MersenneTwister(this.settings.seed);

		if (topItem) while(--topItem) {
			currentItem = Math.floor(m.random() * (topItem + 1));
			tmp = inGrid[currentItem];
			inGrid[currentItem] = inGrid[topItem];
			inGrid[topItem] = tmp;
		}

		return inGrid;
	},

	/**
	 * Fills the main grid table based on current grid data.
	 */
	fillTable: function (inTable, maxRows, inDemo) {
		// use the main table as default
		var table = inTable || this.table,
			rowNumber = 0,
			isDemo = inDemo || false;

		// empty existing table
		while (table.firstChild) {
			table.removeChild(table.firstChild);
		}

		// generate elements for the new table
		for (var row in this.grid) {
			var tableRow = document.createElement('tr');
			table.appendChild(tableRow);
			
			for (var cell in this.grid[row]) {
				var cellValue = this.grid[row][cell];
				var tableCell = document.createElement('td');
				if (cellValue === 1 && !isDemo) {
					tableCell.className = 'cell-filled';
					tableCell.innerHTML = parseInt(cell) + 1;
				}
				tableRow.appendChild(tableCell);
			}
			// exit if necessary
			if (++rowNumber >= maxRows)
				break;
		}
	},

	generateGridForm: function () {
		// remove old grid form
		while (this.gridForm.firstChild) {
			this.gridForm.removeChild(this.gridForm.firstChild);
		}

		// generate element labels at the top
		var elementLabels = Element.make('ul', {
			'class': 'element-label-header'
		});
		for (var e = 0; e < this.ppData.grid[0].length; e++) {
			elementLabels.appendChild(Element.make('li', {
				'innerHTML': (this.settings.elements[e] !== undefined) ? this.settings.elements[e] : 'Element ' + (e+1)
			}));
		}
		this.gridForm.appendChild(elementLabels);
		
		// generate row by row
		for (var row in this.ppData.grid) {
			row = parseInt(row);
			var gridRowTable = Element.make('table', {
				'id': row + '_table',
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
			this.revealRow(this.ppData.grid, $(rowID + '_table'), rowID, row);
		} else {
			// set the expanded state correctly
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
			// if expanding, generate the Likert scale rows
			else {
				// disable the label inputs
				$(rowID + '-label-em').disabled = true;
				$(rowID + '-label-im').disabled = true;

				// add each scale
				for (var i = 0; i < this.ppData.grid[0].length; i++) {
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
					for (var j = 0; j < this.settings.ratingPoints; j++) {
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

	revealRow: function (inGrid, inTable, inRowID, inRow) {
		// do reveal table cells
		var tableCells = inTable.childNodes[0].childNodes;

		for (var i = 0; i < tableCells.length; i++) {
			if (inGrid[inRowID][i] === 1)
				tableCells[i].addClass('cell-filled');
		}

		// set the revealed state correctly
		if (inRow && inRow !== null)
			inRow.setAttribute('revealed', true);
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
		var tableRowCells = $(rowID + '_table').childNodes[0].childNodes;
		tableRowCells[element].innerHTML = value;
		
		// update ppData
		this.ppData.ratings[rowID][element] = value;

		this.onDataChange();
	},

	onSettingsChange: function () {
		// save settings to localStorage
		if (localStorage)
			localStorage.setObject('rgt-settings', this.settings);

		this.fillOutput();
	},

	onDataChange: function () {
		// save data to localStorage
		if (localStorage)
			localStorage.setObject('rgt-ppData', this.ppData);

		this.fillOutput();
	},

	/**
	 * Remove all items from localStorage associated with this page.
	 */
	clearStorage: function () {
		if (localStorage) {
			for (var key in localStorage) {
				if (key.indexOf('rgt-') !== -1)
					localStorage.removeItem(key);
			}
		}
	},

	fillOutput: function () {
		var s = this.settings.separator,
		out = 'participant' + s + this.ppData.participantNumber + '\n';
		out += 'size' + s + this.settings.size + '' + s + this.settings.selectSize + '\n';
		out += 'seed' + s + this.settings.useSeed + '' + s + this.settings.seed + s + '\n';
		out += s + '\n';
		
		// add ratings grid
		out += 'Ratings grid,\n';
		out += s + this.settings.elements.join(s) + s + '\n';
		for (var row = 0; row < this.ppData.grid.length; row++) {
			out += this.ppData.labels[row][0] + s + this.ppData.ratings[row].join(s)
				+ s + this.ppData.labels[row][1] + '\n';
		}

		out += s + '\n';

		// add selection grid
		out += 'Set selection grid,\n';
		out += s + this.settings.elements.join(s) + s + '\n';
		for (var row = 0; row < this.ppData.grid.length; row++) {
			out += this.ppData.labels[row][0] + '' + s + this.ppData.grid[row].join(s)
				+ '' + s + this.ppData.labels[row][1] + '\n';
		}

		// fill textarea
		this.output.value = out;

		// also save to localStorage
		if (localStorage)
			localStorage.setObject('rgt-data-' + this.ppData.participantNumber, out);
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