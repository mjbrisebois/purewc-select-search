
class BaseElement extends HTMLElement {
    constructor () {
	super();

	const observer			= new MutationObserver( () => {
	    this.mutationCallback && this.mutationCallback();
	});
	observer.observe( this, {
	    "characterData": false,
	    "childList": true,
	    "attributes": false,
	});

	if ( this.constructor.template === undefined )
	    throw new Error(`Missing template for ${this.constructor.name}`);

	let template			 	= this.constructor.template;
	this.constructor.$template		= document.createElement("template");

	if ( this.constructor.CSS )
	    template				= `<style>\n${this.constructor.CSS}\n</style>` + template;

	this.constructor.$template.innerHTML	= template;

	this.attachShadow({ mode: "open" });
	this.shadowRoot.appendChild(
	    this.constructor.$template.content.cloneNode(true)
	);


	const $this				= this;
	const __props_store			= {};
	Object.defineProperty( this, "__props", {
	    "value": {},
	});

	Object.entries( this.constructor.refs ).forEach( ([key, selector]) => {
	    Object.defineProperty( this, key, {
		get () {
		    return this.shadowRoot.querySelector( selector );
		},
		// set ( value ) {
		// },
	    });
	});

	this.constructor.observedAttributes.push( ...Object.keys( this.constructor.properties ) );

	Object.entries( this.constructor.properties ).forEach( ([key, config]) => {
	    Object.defineProperty( this.__props, key, {
		get () {
		    return __props_store[ key ] || config.default;
		},
		set ( value ) {
		    __props_store[ key ]	= value;

		    if ( config.updated ) {
			config.updated.call( $this );
		    }
		},
	    });

	    Object.defineProperty( this, key, {
		get () {
		    return this.__props[ key ];
		},
		set ( value ) {
		    this.__props[ key ]		= value;

		    if ( config.reflect !== false )
			this.setAttribute( key, value );
		},
	    });
	});
    }
}

class SelectSearchElement extends BaseElement {
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
	    updated () {
		const change = new Event('change');
		this.dispatchEvent( change );

		const input = new InputEvent('input');
		this.dispatchEvent( input );

		this.$selected.innerHTML	= this.name;

		const index			= this.options.indexOf( this.value );
		const $el			= this.optionElements[ index ];

		if ( this.$active )
		    this.$active.classList.remove("active");

		if ( $el )
		    $el.classList.add("active");
	    },
	},
	"search": {
	    "default": "",
	    updated () {
		const search			= this.search.trim().toLowerCase();
		this.$input.setAttribute( "value", search );

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
	    },
	},
	"searching": {
	    "default": false,
	    "reflect": false,
	    updated () {
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
	    "default": "",
	    updated () {
		if ( this.placeholder === null || this.placeholder === undefined )
		    this.$input.removeAttribute("placeholder");
		else
		    this.$input.setAttribute("placeholder", this.placeholder );
	    },
	},
    };

    static refs				= {
	"$input":		"input",
	"$display":		"#display",
	"$selected":		"#display span",

	"$options":		"#options",
	"$active":		"#options .active",
	"$dropdown":		"#options .dropdown",
    };

    options				= [];
    optionNames				= [];
    visibleOptions			= [];
    optionElements			= [];

    constructor () {
	super();

	this.addEventListener("click", event => this.$input.focus() );

	this.$input.addEventListener("blur", this.inputBlur.bind(this) );
	this.$input.addEventListener("focus", this.inputFocus.bind(this) );
	this.$input.addEventListener("keyup", this.inputKeyUpHandler.bind(this) );
    }

    connectedCallback() {
	this.parseOptions();
    }

    mutationCallback() {
	this.parseOptions();
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

    get name () {
	const index			= this.options.indexOf( this.value );
	return index >= 0
	    ? this.optionNames[ index ]
	    : this.value;
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

		$option.addEventListener("mousedown", event => {
		    this.clickOption.call( this, event, value );
		});

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
