import HTMLElementTemplate from '@purewc/template';

export class HTMLSelectSearchElement extends HTMLElementTemplate {
    static CSS				= `
:host {
  display: inline-block;
  position: relative;
  width: 100%;
  border: 1px solid rgb(118, 118, 118);
  border-radius: 3px;
  cursor: default;
  background-image: url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: 100% 50%;
}

.hide {
  display: none;
}

input {
  font-size: 1rem;
  font-family: inherit;
  line-height: inherit;
  border: none;
  outline: none;
}

#display {
  width: 100%;
}
#display span,
#display.searching input {
  box-sizing: border-box;
  width: 100%;
  display: inline-block;
  padding: 0 .4em;
}
#display.searching input {
  position: relative;
  max-height: inherit;
  overflow: auto;
  opacity: 1;
}
#display input {
  position: absolute;
  top: 0;
  left: 0;
  max-height: 0px;
  overflow: hidden;
  opacity: .01;
}
#display.searching span {
  display: none;
}

#options {
  box-sizing: border-box;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  display: none;
}
#options.searching {
  display: block;
}

#options {
  width: 100%;
}
#options .dropdown {
  width: 100%;
  max-height: 50vh;
  overflow-y: auto;
  position: absolute;
  top: 1px;
  left: 0;
  z-index: 9999;
  background-color: white;
  box-shadow: #ddd 0 2px 15px;
}

.dropdown div {
  box-sizing: border-box;
  width: 100%;
  padding: .1em .4em;
  white-space: no-wrap;
}
.dropdown div.active {
  font-weight: 800;
}
.dropdown div.active,
.dropdown div:hover {
  background-color: #eee;
}
`;

    static template			= `
<div id="display">
    <span></span>
    <input name="search">
    </input>
</div>
<div id="options">
    <div class="dropdown">
    </div>
</div>
`;


    // Element constants

    static observedAttributes		= [
	"options",
	"value",
	"placeholder",
	"search",
	"searching",
    ];
    static properties			= {
	"value": {
	    "default": "",
	    updateDOM ( before, changed ) {
		const change = new Event('change');
		this.dispatchEvent( change );

		const input = new InputEvent('input');
		this.dispatchEvent( input );

		this.$selected.innerText	= this.name || this.value;
		const $el			= this.optionMatch;

		if ( this.$active )
		    this.$active.classList.remove("active");

		if ( $el )
		    $el.classList.add("active");
	    },
	},
	"search": {
	    "default": "",
	    updateDOM () {
		const search			= this.search.trim().toLowerCase();
		this.$input.setAttribute( "value", search );

		this.optionElements.forEach( ($option) => {
		    const value			= $option.getAttribute("value").toLowerCase();
		    const name			= $option.innerText.toLowerCase();

		    if ( value.includes( search ) || name.includes( search ) )
			$option.classList.remove("hide");
		    else
			$option.classList.add("hide");
		});
	    },
	},
	"searching": {
	    "default": false,
	    "reflect": false,
	    updateDOM () {
		if ( this.searching ) {
		    this.$display.classList.add("searching");
		    this.$options.classList.add("searching");

		    this.$input.select();
		} else {
		    this.$display.classList.remove("searching");
		    this.$options.classList.remove("searching");
		}
	    },
	},

	// "options",
	"placeholder": {
	    updateDOM () {
		if ( this.placeholder === undefined )
		    this.$input.removeAttribute("placeholder");
		else
		    this.$input.setAttribute("placeholder", this.placeholder );
	    },
	},
    };

    static refs				= {
	"$input":		`input`,
	"$display":		`#display`,
	"$selected":		`#display span`,

	"$options":		`#options`,
	"$active":		`#options .active`,
	"$default":		`#options div[value=""]`,
	"$dropdown":		`#options .dropdown`,

	"optionsList":		`#options div[value]`,
    };


    optionNames				= [];
    optionElements			= [];

    options				= [];
    optionsTextMap			= {};


    constructor () {
	super();

	this.addEventListener("click", event => this.$input.focus() );

	this.$input.addEventListener("blur", this.inputBlur.bind(this) );
	this.$input.addEventListener("focus", this.inputFocus.bind(this) );
	this.$input.addEventListener("keyup", this.inputKeyUpHandler.bind(this) );
	this.$input.addEventListener("keydown", this.inputKeyDownHandler.bind(this) );
	this.$input.addEventListener("input", event => {
	    event.stopPropagation();
	});
    }

    connectedCallback() {
	this.parseOptions();
    }

    mutationCallback() {
	this.parseOptions();
    }


    // Property/attribute controllers

    get optionMatch () {
	return this.visibleOptions.find( $option => {
	    return $option.getAttribute("value") === this.value;
	});
    }

    get name () {
	if ( this.value === "" )
	    return this.defaultOption ? this.defaultOption.innerText : "";

	return this.optionMatch ? this.optionMatch.innerText : null;
    }

    get visibleOptions () {
	return [].filter.call( this.optionsList, $el => {
	    return !$el.classList.contains("hide");
	});
    }


    // Methods

    parseOptions () {
	// Matched on value and text
	//
	//   - If a new option appears with a new value
	//     - then, create new option
	//   - If a new option appears with a new text but same value
	//     - then, create a new option
	//   - If a new option appears with a new value but same text
	//     - then, update the existing option's value
	//   - If an option value disappears
	//     - then, do nothing
	//   - If an option text disappears
	//     - then, remove it from options
	//

	const currentOptionTexts	= new Set( Object.keys( this.optionsTextMap ) );

	for ( let element of this.children ) {
	    if ( !(element instanceof HTMLOptionElement) )
		continue;

	    const value			= element.value;
	    const text			= element.innerText.trim();

	    currentOptionTexts.delete( text );

	    if ( text in this.optionsTextMap ) {
		// Exists
		continue;
	    }

	    const $option			= document.createElement("div");

	    this.optionElements.push( $option );

	    if ( value.trim() !== "" ) {
		this.optionNames.push( text );
		this.optionNames.sort();
	    }

	    const index				= this.optionNames.indexOf( text );

	    $option.innerText			= text;
	    $option.setAttribute("value", value );
	    $option.addEventListener("mousedown", event => {
		// Only trigger via left click
		if ( event.which === 1 )
		    this.clickOption.call( this, event, value );
	    });

	    this.optionsTextMap[ text ]		= $option;

	    if ( value.trim() === "" ) {
		this.defaultOption		= $option;
		this.$dropdown.prepend( $option );
	    }
	    else if ( index === 0 ) {
		if ( this.$default )
		    this.$default.after( $option );
		else
		    this.$dropdown.prepend( $option );
	    }
	    else {
		const $sibling			= this.optionsTextMap[ this.optionNames[ index-1 ] ];
		$sibling.after( $option );
	    }

	    // If 'selected' was already set by the attribute before the option was parsed.
	    if ( this.name === text ) {
		$option.classList.add("active");
		this.$selected.innerText	= text;
	    }
	}

	for ( let text of currentOptionTexts ) {
	    this.optionsTextMap[ text ].remove();

	    delete this.optionsTextMap[ text ]
	}
    }

    openSearch () {
	this.searching			= true;
    }

    closeSearch () {
	this.searching			= false;
    }


    // Event handlers

    inputKeyDownHandler ( event ) {
	if ( event.code === "Tab"
	     && this.search
	     && this.visibleOptions[0] )
	    this.value		= this.visibleOptions[0].getAttribute("value");
    }

    inputKeyUpHandler ( event ) {
	if ( event.code === "Enter" ) {
	    this.value			= this.visibleOptions[0]
		? this.visibleOptions[0].getAttribute("value")
		: event.target.value

	    this.$input.blur();
	}
	else if ( event.code === "Escape" )
	    this.closeSearch();

	if ( this.search !== event.target.value )
	    this.search			= event.target.value;
    }

    inputBlur ( event ) {
	this.closeSearch();
    }

    inputFocus ( event ) {
	this.openSearch();
    }

    clickOption ( event, value ) {
	const click = new MouseEvent('click', {
	    view: window,
	    bubbles: true,
	    cancelable: true
	});
	this.dispatchEvent( click );

	this.value			= value;
    }
}
