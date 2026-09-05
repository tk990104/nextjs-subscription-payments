const Logo = ({ ...props }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="cipher-forge-mark" x1="4" y1="3" x2="28" y2="29">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="10" fill="#18181B" />
    <rect
      x="0.75"
      y="0.75"
      width="30.5"
      height="30.5"
      rx="9.25"
      stroke="url(#cipher-forge-mark)"
      strokeWidth="1.5"
    />
    <path
      d="M10 8.5h12M8.5 13.5h15M10 18.5h12M12 23.5h8"
      stroke="url(#cipher-forge-mark)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="13.5" r="2.25" fill="#FAFAFA" />
  </svg>
);

export default Logo;
