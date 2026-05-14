import {
	Button,
	Description,
	FieldError,
	Input,
	Label,
	Link,
	Modal,
	Spinner,
	TextField,
} from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import {
	API_KEY_PREFIX,
	ApiKey,
	useSettings,
	useUpdateAPIKey,
} from "#/lib/auth";

export function SettingsModal({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}) {
	const settings = useSettings();
	const updateAPIKey = useUpdateAPIKey();

	const form = useForm({
		defaultValues: settings,
		onSubmit: ({ value }) => {
			updateAPIKey(value.apiKey);
			setIsOpen(false);
		},
	});

	return (
		<Modal.Backdrop
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			shouldCloseOnInteractOutside={() => false}
		>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-90">
					<Modal.Header className="px-1">
						<Modal.Heading>Settings</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="px-1 pb-2 pt-3">
						<form.Field name="apiKey" validators={{ onBlur: ApiKey }}>
							{(field) => {
								const error = field.state.meta.errors.at(0)?.message;
								return (
									<TextField
										fullWidth
										type="text"
										autoComplete="off"
										autoCorrect="off"
										isInvalid={!!error}
									>
										<Label>Octopus API key</Label>
										<Input
											placeholder={`${API_KEY_PREFIX}...`}
											className="border border-border/60 font-mono"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={(e) => {
												const val = e.target.value.trim() || undefined;
												field.handleChange(val);
												field.handleBlur();
											}}
										/>
										<Description>
											To view your energy data, generate an API key in your{" "}
											<Link
												href="https://octopus.energy/dashboard/new/accounts/personal-details/api-access"
												className="text-[length:inherit]"
												target="_blank"
												rel="noopener noreferrer"
											>
												Octopus account settings
											</Link>
										</Description>
										{error && <FieldError>{error}</FieldError>}
									</TextField>
								);
							}}
						</form.Field>
					</Modal.Body>
					<Modal.Footer className="grid grid-cols-2">
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button
									fullWidth
									onPress={() => form.handleSubmit()}
									isPending={isSubmitting}
								>
									{isSubmitting && <Spinner color="current" size="sm" />}
									{isSubmitting ? "Saving" : "Save"}
								</Button>
							)}
						</form.Subscribe>
						<Button
							variant="secondary"
							fullWidth
							onPress={() => setIsOpen(false)}
						>
							Cancel
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
