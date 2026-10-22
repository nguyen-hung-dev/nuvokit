#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args
        .iter()
        .any(|arg| arg == "--smoke-test" || arg == "--smoke-install")
    {
        if let Err(error) =
            nuvokit_core::smoke_test(args.iter().any(|arg| arg == "--smoke-install"))
        {
            eprintln!("{error}");
            std::process::exit(1);
        }
    } else {
        nuvokit_core::run();
    }
}
