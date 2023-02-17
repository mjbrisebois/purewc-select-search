
export class HTMLSelectSearchElement extends LitElement {
    static get properties () {
	return {
	    "options": {
		"type": Array,
		"reflect": false,
	    },
	    "value": {
		"type": String,
		"reflect": true,
	    },
	    "placeholder": {
		"type": String,
		"reflect": true,
	    },
	    "search": {
		"type": String,
		"reflect": true,
	    },
	    "searching": {
		"type": Boolean,
		"reflect": false,
	    },
	};
    }

    static styles = [
	css`
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

input {
  font-size: 1rem;
  font-family: inherit;
  line-height: inherit;
  border: none;
  outline: none;
}

.d-block {
  display: block;
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
.dropdown div.active,
.dropdown div:hover {
  background-color: #eee;
}
`,
    ];


    // Element constants

    inputRef				= createRef();
    options				= [];
    optionNames				= [];
    visibleOptions			= [];

    constructor () {
	super();

	const $this			= this;
	this.value			= "";
	this.search			= "";
	this.searching			= false;

	const observer			= new MutationObserver(function(mutationsList, observer) {
	    $this.parseOptions();
	});
	observer.observe( this, {
	    "characterData": false,
	    "childList": true,
	    "attributes": false,
	});

	$this.parseOptions();

	this.addEventListener("click", this.openSearch );
    }


    // Property/attribute controllers

    get name () {
	return this.optionNames[ this.options.indexOf( this.value ) ];
    }

    set value ( text ) {
	this.__value		= text.trim();

	this.requestUpdate();
    }
    get value () {
	return this.__value;
    }

    set search ( value ) {
	if ( typeof value !== "string" )
	    throw new TypeError(`search value must be a string; not type of '${typeof value}'`);

	this.__search			= value.trim().toLowerCase();

	this.visibleOptions.splice( 0, this.visibleOptions.length );

	this.options.forEach( (value, i) => {
	    if ( value.toLowerCase().includes( this.__search ) )
		this.visibleOptions.push( i );
	});

	this.requestUpdate();
    }
    get search () {
	return this.__search;
    }

    set searching ( value ) {
	this.__searching		= !!value;

	if ( this.__searching === true )
	    this.focusSearch		= true;

	this.requestUpdate();
    }
    get searching () {
	return this.__searching;
    }


    // Lifecycle hooks

    updated () {
	if ( this.focusSearch === true ) {
	    this.inputRef.value.select();
	    this.focusSearch		= false;
	}
    }


    // Methods

    parseOptions () {
	this.options.splice( 0, this.options.length );
	this.optionNames.splice( 0, this.optionNames.length );

	for ( let element of this.children ) {
	    if ( element instanceof HTMLOptionElement ) {
		this.options.push( element.value );
		this.optionNames.push( element.innerText );
	    }
	}

	this.search			= "";

	this.requestUpdate();
    }

    updateValue ( value ) {
	this.value			= value;
	this.setAttribute("value", this.value );

	const change = new Event('change');
	this.dispatchEvent( change );

	const input = new InputEvent('input');
	this.dispatchEvent( input );
    }

    selectOption ( index ) {
	this.updateValue( this.options[index] );
	this.closeSearch();
    }

    openSearch () {
	this.searching			= true;
    }

    closeSearch () {
	this.searching			= false;
    }


    // Event handlers

    inputKeyUpHandler ( event ) {
	if ( event.code === "Enter" && this.visibleOptions[0] )
	    this.selectOption( this.visibleOptions[0] );
	else if ( event.code === "Escape" )
	    this.closeSearch();

	this.search			= event.target.value;
	this.setAttribute("search", this.search );
    }

    inputFocus ( event ) {
	this.openSearch();
    }

    inputBlur ( event ) {
	setTimeout(() => {
	    this.closeSearch();
	}, 100);
    }

    clickOption ( event, value ) {
	const click = new MouseEvent('click', {
	    view: window,
	    bubbles: true,
	    cancelable: true
	});
	this.dispatchEvent( click );

	this.updateValue( value );
	this.closeSearch();

	setTimeout(() => {
	    this.inputRef.value.blur();
	}, 100 );
    }


    // Rendering

    renderOption ( i ) {
	const value			= this.options[i];
	const name			= this.optionNames[i]

	if ( this.value === value )
	    return html`<div class="active" style="font-weight: 800;" value=${value}>${ name }</div>`;
	else
	    return html`<div @click=${event => this.clickOption.call( this, event, value )} value=${value}>${ name }</div>`;
    }

    render () {
	const classes			= {
	    "searching": this.searching,
	};

	return html`
<div id="display" class=${classMap(classes)}>
    <span>${this.name}</span>
    <input ${ref(this.inputRef)} name="search" value=${this.search}
           placeholder=${this.placeholder}
           @keyup=${this.inputKeyUpHandler}
           @focus=${this.inputFocus}
           @blur=${this.inputBlur}>
    </input>
</div>
<div id="options" class=${classMap(classes)}>
    <div class="dropdown">
        ${this.visibleOptions.map( index => this.renderOption( index ) )}
    </div>
</div>
`;
    }
}
