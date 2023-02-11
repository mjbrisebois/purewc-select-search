
const template			= document.createElement("template");
template.innerHTML = `
<style>
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
.dropdown div.active {
  font-weight: 800;
}
.dropdown div.active,
.dropdown div:hover {
  background-color: #eee;
}
</style>

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

class SelectSearchElement extends HTMLElement {
    static observedAttributes		= [
	"options",
	"value",
	"placeholder",
	"search",
	"searching",
    ];

    // Element constants

    __props				= {
	"value": "",
	"search": "",
	"searching": false,
    };
    options				= [];
    optionNames				= [];
    visibleOptions			= [];
    optionElements			= [];

    constructor () {
	super();

	this.addEventListener("click", event => this.$input.focus() );

	this.attachShadow({ mode: "open" });
	this.shadowRoot.appendChild(
	    template.content.cloneNode(true)
	);

	this.$options			= this.shadowRoot.querySelector("#options");
	this.$display			= this.shadowRoot.querySelector("#display");

	this.$input			= this.shadowRoot.querySelector("input");

	this.$selected			= this.shadowRoot.querySelector("#display span");
	this.$dropdown			= this.shadowRoot.querySelector("#options .dropdown");


	this.$input.onblur		= this.inputBlur.bind(this);
	this.$input.onfocus		= this.inputFocus.bind(this);
        this.$input.onkeyup		= this.inputKeyUpHandler.bind(this);
    }

    connectedCallback() {
	const $this			= this;
	const observer			= new MutationObserver(function(mutationsList, observer) {
	    $this.parseOptions();
	});
	observer.observe( this, {
	    "characterData": false,
	    "childList": true,
	    "attributes": false,
	});

	$this.parseOptions();
    }

    attributeChangedCallback( name, oldValue, newValue ) {
	this.__props[ name ]		= newValue;

	if ( name === "value" ) {
	    this.$selected.innerHTML	= this.name;
	}
	else if ( name === "placeholder" )
	    this.$input.setAttribute("placeholder", newValue );
    }


    // Property/attribute controllers

    get $active () {
	return this.shadowRoot.querySelector("#options .active");
    }

    get name () {
	const index			= this.options.indexOf( this.value );
	return index >= 0
	    ? this.optionNames[ index ]
	    : this.value;
    }

    set value ( text ) {
	const value			= text.trim();

	this.__props.value		= value;

	this.setAttribute( "value", value );

	this.$selected.innerHTML	= this.name;

	const index			= this.options.indexOf( this.value );
	const $el			= this.optionElements[ index ];

	this.$active.classList.remove("active");
	$el.classList.add("active");
    }
    get value () {
	return this.__props.value || "";
    }

    set search ( value ) {
	if ( typeof value !== "string" )
	    throw new TypeError(`search value must be a string; not type of '${typeof value}'`);

	const search			= value.trim().toLowerCase();
	this.$input.setAttribute( "value", search );
	this.setAttribute("search", search );

	this.visibleOptions.splice( 0, this.visibleOptions.length );

	this.options.forEach( (value, index) => {
	    const name			= this.optionNames[index].toLowerCase();
	    if ( value.toLowerCase().includes( search ) || name.includes( search ) ) {
		this.visibleOptions.push( index );
		this.optionElements[ index ].classList.remove("hide");
	    }
	    else
		this.optionElements[ index ].classList.add("hide");
	});
    }
    get search () {
	return this.__props.search;
    }

    set searching ( value ) {
	this.__props.searching		= !!value;

	if ( this.searching ) {
	    this.$display.classList.add("searching");
	    this.$options.classList.add("searching");

	    this.$input.select();
	} else {
	    this.$display.classList.remove("searching");
	    this.$options.classList.remove("searching");
	}
    }
    get searching () {
	return this.__props.searching;
    }

    set placeholder ( text ) {
	this.__props.placeholder	= text;

	if ( text === null || text === undefined ) {
	    this.$input.removeAttribute("placeholder");
	}
	else {
	    this.$input.setAttribute("placeholder", text );
	}
    }
    get placeholder () {
	return this.__props.placeholder;
    }


    // Methods

    parseOptions () {
	this.options.splice( 0, this.options.length );
	this.optionNames.splice( 0, this.optionNames.length );

	for ( let element of this.children ) {
	    if ( element instanceof HTMLOptionElement ) {
		const value		= element.value;
		const text		= element.innerText;

		this.options.push( value );
		this.optionNames.push( text );

		const $option		= document.createElement("div");

		$option.setAttribute("value", value );
		$option.innerHTML	= text;

		if ( this.value === value ) {
		    $option.classList.add("active");
		    this.$selected.innerHTML	= text;
		}

		$option.onmousedown	= event => {
		    this.clickOption.call( this, event, value );
		};

		this.optionElements.push( $option );
		this.$dropdown.appendChild( $option );
	    }
	}
    }

    updateValue ( value ) {
	const current			= this.value;
	this.value			= value;

	if ( current === this.value )
	    return;

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
	if ( event.code === "Enter" && this.visibleOptions[0] !== undefined )
	    this.selectOption( this.visibleOptions[0] );
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

	this.updateValue( value );
    }
}

customElements.define("select-search", SelectSearchElement );
